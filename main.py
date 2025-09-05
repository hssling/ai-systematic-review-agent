from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uvicorn
from datetime import datetime

# Import our modules
from article_generator import ArticleGenerator
from protocol_generator import ProtocolGenerator
from literature_search import LiteratureSearch
from screening_module import ScreeningModule
from data_extraction import DataExtractionModule
from quality_assessment import QualityAssessmentModule
from meta_analysis import MetaAnalysisModule
from models import (
    Protocol, Study, DataExtraction as DataExtractionModel,
    QualityAssessment as QualityAssessmentModel, MetaAnalysis as MetaAnalysisModel,
    create_tables, engine, ai_manager
)
from sqlalchemy.orm import sessionmaker

# Database setup
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
create_tables()

# FastAPI app
app = FastAPI(title="Systematic Review AI Assistant", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response
class ProtocolRequest(BaseModel):
    researchQuestion: str
    pico: Dict[str, str]
    apiKey: str

class LiteratureSearchRequest(BaseModel):
    query: str
    apiKey: str

class ScreeningRequest(BaseModel):
    studies: List[Dict[str, Any]]
    inclusionCriteria: str
    exclusionCriteria: str
    apiKey: str

class DataExtractionRequest(BaseModel):
    studies: List[Dict[str, Any]]
    apiKey: str

class QualityAssessmentRequest(BaseModel):
    studies: List[Dict[str, Any]]
    apiKey: str

class MetaAnalysisRequest(BaseModel):
    extractedData: List[Dict[str, Any]]
    apiKey: str

class ArticleGenerationRequest(BaseModel):
    protocol: Dict[str, Any]
    studies: List[Dict[str, Any]]
    extractedData: List[Dict[str, Any]]
    qualityAssessments: List[Dict[str, Any]]
    metaResults: Dict[str, Any]
    apiKey: str

# API Endpoints
@app.post("/api/generate-protocol")
async def generate_protocol(request: ProtocolRequest):
    """Generate a systematic review protocol"""
    try:
        generator = ProtocolGenerator(request.apiKey)
        result = generator.generate_protocol(
            request.researchQuestion,
            request.pico
        )

        # Save to database
        db = SessionLocal()
        protocol = Protocol(
            title=f"Protocol for: {request.researchQuestion[:100]}",
            research_question=request.researchQuestion,
            pico_population=request.pico.get('population', ''),
            pico_intervention=request.pico.get('intervention', ''),
            pico_comparison=request.pico.get('comparison', ''),
            pico_outcome=request.pico.get('outcome', ''),
            inclusion_criteria=result.get('eligibility_criteria', ''),
            exclusion_criteria=result.get('exclusion_criteria', '')
        )
        db.add(protocol)
        db.commit()
        db.refresh(protocol)
        db.close()

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/search-literature")
async def search_literature(request: LiteratureSearchRequest):
    """Search for literature using PubMed API"""
    try:
        searcher = LiteratureSearch(request.apiKey)
        results = searcher.search_pubmed(request.query)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/screen-studies")
async def screen_studies(request: ScreeningRequest):
    """Screen studies based on inclusion/exclusion criteria"""
    try:
        screener = ScreeningModule(request.apiKey)
        results = screener.screen_studies(
            request.studies,
            request.inclusionCriteria,
            request.exclusionCriteria
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/extract-data")
async def extract_data(request: DataExtractionRequest):
    """Extract data from studies"""
    try:
        extractor = DataExtractionModule(request.apiKey)
        results = extractor.extract_data_from_articles(request.studies)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/assess-quality")
async def assess_quality(request: QualityAssessmentRequest):
    """Assess quality of studies using NOS"""
    try:
        assessor = QualityAssessmentModule(request.apiKey)
        results = assessor.batch_assess_quality(request.studies)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/meta-analysis")
async def perform_meta_analysis(request: MetaAnalysisRequest):
    """Perform meta-analysis on extracted data"""
    try:
        analyzer = MetaAnalysisModule()
        results = analyzer.perform_meta_analysis(request.extractedData, "outcome_name")
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-article")
async def generate_article(request: ArticleGenerationRequest):
    """Generate complete systematic review article"""
    try:
        generator = ArticleGenerator(request.apiKey)
        article = generator.generate_systematic_review_article(
            request.protocol,
            request.studies,
            request.extractedData,
            request.qualityAssessments,
            request.metaResults
        )
        return article
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.get("/api/models")
async def get_available_models():
    """Get list of available models with API key status"""
    try:
        available_models = ai_manager.get_available_models()

        # Enhanced model information
        model_details = {}
        for model in available_models:
            config = ai_manager.SUPPORTED_MODELS.get(model, {})
            provider = config.get('provider', 'unknown')

            model_details[model] = {
                'provider': provider,
                'available': True,
                'requires_key': provider not in ['ollama'],
                'free': provider in ['deepseek', 'ollama'],
                'recommended': model in ['gpt-4-turbo', 'deepseek-chat', 'claude-3-sonnet']
            }

        return {
            'available_models': model_details,
            'default_model': 'gpt-4-turbo' if 'gpt-4-turbo' in available_models else (available_models[0] if available_models else None)
        }
    except Exception as e:
        # Fallback response if models fail to load
        fallback_models = {
            'deepseek-chat': {
                'provider': 'deepseek',
                'available': True,
                'requires_key': False,
                'free': True,
                'recommended': True
            },
            'deepseek-coder': {
                'provider': 'deepseek',
                'available': True,
                'requires_key': False,
                'free': True,
                'recommended': False
            },
            'llama-2-7b': {
                'provider': 'ollama',
                'available': True,
                'requires_key': False,
                'free': True,
                'recommended': False
            },
            'codellama': {
                'provider': 'ollama',
                'available': True,
                'requires_key': False,
                'free': True,
                'recommended': False
            }
        }
        return {
            'available_models': fallback_models,
            'default_model': 'deepseek-chat'
        }

@app.get("/api/models/{model_name}/config")
async def get_model_config(model_name: str):
    """Get configuration for a specific model"""
    available_models = ai_manager.get_available_models()

    if model_name not in available_models:
        raise HTTPException(status_code=404, detail="Model not available")

    config = ai_manager.SUPPORTED_MODELS.get(model_name, {})
    provider = config.get('provider', 'unknown')

    return {
        'model': model_name,
        'provider': provider,
        'available': True,
        'requires_key': provider not in ['ollama'],
        'free': provider in ['deepseek', 'ollama'],
        'description': _get_model_description(model_name)
    }

def _get_model_description(model_name: str) -> str:
    """Get description for a model"""
    descriptions = {
        'gpt-4-turbo': 'OpenAI GPT-4 Turbo - Fast, high-performance model',
        'gpt-4': 'OpenAI GPT-4 - Premium model with excellent reasoning',
        'gpt-3.5-turbo': 'OpenAI GPT-3.5 Turbo - Cost-effective alternative',
        'claude-3-opus': 'Claude 3 Opus - Excellent for complex systematic reviews',
        'claude-3-sonnet': 'Claude 3 Sonnet - Balanced performance and speed',
        'claude-haiku': 'Claude 3 Haiku - Fast responses for routine tasks',
        'gemini-pro': 'Google Gemini Pro - Multi-modal understanding',
        'gemini-pro-vision': 'Google Gemini Vision - Image and text analysis',
        'deepseek-chat': 'DeepSeek Chat - FREE high-quality general model',
        'deepseek-coder': 'DeepSeek Coder - FREE specialized for analysis',
        'llama-2-7b': 'Llama 2 7B - Local model, complete privacy',
        'codellama': 'CodeLlama - Local model for coding tasks'
    }
    return descriptions.get(model_name, 'Unknown model')

@app.post("/api/use-model/{model_name}")
async def use_model(model_name: str, request: dict = None):
    """Set the active model and handle API key setup"""
    if not ai_manager.set_model(model_name):
        raise HTTPException(status_code=400, detail="Model not available")

    return {
        'model': model_name,
        'status': 'active',
        'requires_key': ai_manager.SUPPORTED_MODELS[model_name]['provider'] not in ['ollama', 'deepseek']
    }

@app.get("/protocols")
async def get_protocols():
    """Get all protocols from database"""
    db = SessionLocal()
    protocols = db.query(Protocol).all()
    db.close()
    return {"protocols": [
        {
            "id": p.id,
            "title": p.title,
            "research_question": p.research_question,
            "created_at": p.created_at.isoformat() if p.created_at else None
        }
        for p in protocols
    ]}

@app.get("/protocols/{protocol_id}")
async def get_protocol(protocol_id: int):
    """Get specific protocol by ID"""
    db = SessionLocal()
    protocol = db.query(Protocol).filter(Protocol.id == protocol_id).first()
    db.close()
    if not protocol:
        raise HTTPException(status_code=404, detail="Protocol not found")
    return {
        "id": protocol.id,
        "title": protocol.title,
        "research_question": protocol.research_question,
        "pico": {
            "population": protocol.pico_population,
            "intervention": protocol.pico_intervention,
            "comparison": protocol.pico_comparison,
            "outcome": protocol.pico_outcome
        },
        "inclusion_criteria": protocol.inclusion_criteria,
        "exclusion_criteria": protocol.exclusion_criteria,
        "created_at": protocol.created_at.isoformat() if protocol.created_at else None
    }

# Download endpoints
@app.get("/download/protocol/{protocol_id}")
async def download_protocol(protocol_id: int):
    """Download protocol as JSON"""
    db = SessionLocal()
    protocol = db.query(Protocol).filter(Protocol.id == protocol_id).first()
    db.close()
    if not protocol:
        raise HTTPException(status_code=404, detail="Protocol not found")

    protocol_data = {
        "id": protocol.id,
        "title": protocol.title,
        "research_question": protocol.research_question,
        "pico": {
            "population": protocol.pico_population,
            "intervention": protocol.pico_intervention,
            "comparison": protocol.pico_comparison,
            "outcome": protocol.pico_outcome
        },
        "inclusion_criteria": protocol.inclusion_criteria,
        "exclusion_criteria": protocol.exclusion_criteria,
        "created_at": protocol.created_at.isoformat() if protocol.created_at else None
    }

    import json
    from fastapi.responses import FileResponse
    import tempfile
    import os

    # Create temporary file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        json.dump(protocol_data, f, indent=2)
        temp_file = f.name

    return FileResponse(
        temp_file,
        media_type='application/json',
        filename=f'protocol_{protocol_id}.json'
    )

@app.post("/download/literature-search")
async def download_literature_search(request: dict):
    """Download literature search results as CSV"""
    try:
        results = request.get("results", [])

        import csv
        import tempfile
        from fastapi.responses import FileResponse

        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False, newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['Title', 'Authors', 'Journal', 'Year', 'Abstract', 'DOI', 'PMID'])

            for study in results:
                writer.writerow([
                    study.get('title', ''),
                    ', '.join(study.get('authors', [])),
                    study.get('journal', ''),
                    study.get('year', ''),
                    study.get('abstract', '')[:500] + '...' if len(study.get('abstract', '')) > 500 else study.get('abstract', ''),
                    study.get('doi', ''),
                    study.get('pmid', '')
                ])

            temp_file = f.name

        return FileResponse(
            temp_file,
            media_type='text/csv',
            filename='literature_search_results.csv'
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")

@app.post("/download/screening-results")
async def download_screening_results(request: dict):
    """Download screening results as CSV"""
    try:
        results = request.get("results", [])

        import csv
        import tempfile
        from fastapi.responses import FileResponse

        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False, newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['Title', 'Authors', 'Year', 'Screening Decision', 'Reasoning'])

            for study in results:
                writer.writerow([
                    study.get('title', ''),
                    ', '.join(study.get('authors', [])),
                    study.get('year', ''),
                    study.get('screening_decision', ''),
                    study.get('screening_reasoning', '')
                ])

            temp_file = f.name

        return FileResponse(
            temp_file,
            media_type='text/csv',
            filename='screening_results.csv'
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")

@app.post("/download/extracted-data")
async def download_extracted_data(request: dict):
    """Download extracted data as CSV"""
    try:
        results = request.get("results", [])

        import csv
        import tempfile
        from fastapi.responses import FileResponse

        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False, newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['Study ID', 'Status', 'Study Design', 'Sample Size', 'Intervention', 'Control', 'Outcome', 'Effect Size'])

            for item in results:
                extracted = item.get('extracted_data', {})
                writer.writerow([
                    item.get('article_id', ''),
                    item.get('extraction_status', ''),
                    extracted.get('study_design', ''),
                    extracted.get('sample_size', ''),
                    extracted.get('intervention', ''),
                    extracted.get('control', ''),
                    extracted.get('outcome', ''),
                    extracted.get('effect_size', '')
                ])

            temp_file = f.name

        return FileResponse(
            temp_file,
            media_type='text/csv',
            filename='extracted_data.csv'
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")

@app.post("/download/quality-assessment")
async def download_quality_assessment(request: dict):
    """Download quality assessment results as CSV"""
    try:
        results = request.get("results", [])

        import csv
        import tempfile
        from fastapi.responses import FileResponse

        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False, newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['Study ID', 'Tool', 'Overall Risk', 'Selection Score', 'Comparability Score', 'Outcome Score', 'Total Score'])

            for assessment in results:
                writer.writerow([
                    assessment.get('study_id', ''),
                    assessment.get('tool', ''),
                    assessment.get('risk_of_bias', ''),
                    assessment.get('selection_score', ''),
                    assessment.get('comparability_score', ''),
                    assessment.get('outcome_score', ''),
                    assessment.get('total_score', '')
                ])

            temp_file = f.name

        return FileResponse(
            temp_file,
            media_type='text/csv',
            filename='quality_assessment.csv'
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")

@app.post("/download/meta-analysis")
async def download_meta_analysis(request: dict):
    """Download meta-analysis results as JSON"""
    try:
        results = request.get("results", {})

        import json
        import tempfile
        from fastapi.responses import FileResponse

        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(results, f, indent=2)
            temp_file = f.name

        return FileResponse(
            temp_file,
            media_type='application/json',
            filename='meta_analysis_results.json'
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")

@app.post("/download/article")
async def download_article(request: dict):
    """Download generated article as Markdown"""
    try:
        article = request.get("article", {})

        import tempfile
        from fastapi.responses import FileResponse

        with tempfile.NamedTemporaryFile(mode='w', suffix='.md', delete=False) as f:
            # Write article as Markdown
            sections = article.get('sections', {})

            f.write(f"# {sections.get('title', 'Systematic Review Article')}\n\n")

            f.write("## Abstract\n\n")
            f.write(f"{sections.get('abstract', '')}\n\n")

            f.write("## Introduction\n\n")
            f.write(f"{sections.get('introduction', '')}\n\n")

            f.write("## Methods\n\n")
            f.write(f"{sections.get('methods', '')}\n\n")

            f.write("## Results\n\n")
            f.write(f"{sections.get('results', '')}\n\n")

            f.write("## Discussion\n\n")
            f.write(f"{sections.get('discussion', '')}\n\n")

            f.write("## Conclusion\n\n")
            f.write(f"{sections.get('conclusion', '')}\n\n")

            f.write("## References\n\n")
            f.write(f"{sections.get('references', '')}\n\n")

            temp_file = f.name

        return FileResponse(
            temp_file,
            media_type='text/markdown',
            filename='systematic_review_article.md'
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")

@app.post("/download/article-word")
async def download_article_word(request: dict):
    """Download generated article as Word document"""
    try:
        article = request.get("article", {})

        import tempfile
        from fastapi.responses import FileResponse
        from article_generator import ArticleGenerator

        # Create temporary generator to export
        generator = ArticleGenerator("dummy_key")  # API key not needed for export

        with tempfile.NamedTemporaryFile(suffix='.docx', delete=False) as f:
            temp_file = f.name

        # Export to Word
        success = generator.export_article_to_word(article, temp_file)

        if not success:
            raise HTTPException(status_code=500, detail="Word export failed")

        return FileResponse(
            temp_file,
            media_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            filename='systematic_review_article.docx'
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Word download failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
