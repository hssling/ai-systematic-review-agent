import openai
from typing import Dict, Any
import json
from datetime import datetime

class ProtocolGenerator:
    def __init__(self, api_key: str):
        self.client = openai.OpenAI(api_key=api_key)

    def generate_protocol(self, research_question: str, pico: Dict[str, str] = None) -> Dict[str, Any]:
        """
        Generate a systematic review protocol using AI
        """
        prompt = f"""
        Generate a comprehensive systematic review protocol for the following research question:
        {research_question}

        {"PICO framework details:" + json.dumps(pico) if pico else ""}

        Please provide a protocol that includes:
        1. Background and rationale
        2. Objectives
        3. Eligibility criteria (inclusion/exclusion)
        4. Search strategy
        5. Study selection process
        6. Data extraction methods
        7. Risk of bias assessment
        8. Data synthesis plan
        9. Dissemination plan

        Format the response as a JSON object with these keys.
        """

        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are an expert in systematic review methodology. Generate detailed, methodologically sound protocols."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=2000,
                temperature=0.7
            )

            # Check if response has the expected structure
            if response and response.choices and len(response.choices) > 0:
                if hasattr(response.choices[0], 'message') and response.choices[0].message:
                    if hasattr(response.choices[0].message, 'content') and response.choices[0].message.content:
                        protocol_text = response.choices[0].message.content
                    else:
                        protocol_text = "{}"  # Empty JSON fallback
                else:
                    protocol_text = "{}"  # Empty JSON fallback
            else:
                protocol_text = "{}"  # Empty JSON fallback

            # Parse the JSON response
            try:
                protocol_data = json.loads(protocol_text)
            except json.JSONDecodeError:
                # If not valid JSON, structure it manually
                protocol_data = self._structure_protocol_text(protocol_text)

            # Add metadata
            protocol_data.update({
                "research_question": research_question,
                "pico": pico or {},
                "generated_at": datetime.utcnow().isoformat(),
                "version": "1.0"
            })

            return protocol_data

        except Exception as e:
            print(f"OpenAI API error in generate_protocol: {str(e)}")
            return {
                "error": f"Failed to generate protocol: {str(e)}",
                "research_question": research_question,
                "pico": pico or {}
            }

    def _structure_protocol_text(self, text: str) -> Dict[str, Any]:
        """
        Structure plain text protocol into organized format
        """
        # Simple parsing - in a real implementation, this would be more sophisticated
        sections = text.split('\n\n')
        protocol = {}

        for section in sections:
            if 'background' in section.lower() or 'rationale' in section.lower():
                protocol['background'] = section
            elif 'objectives' in section.lower():
                protocol['objectives'] = section
            elif 'eligibility' in section.lower() or 'criteria' in section.lower():
                protocol['eligibility_criteria'] = section
            elif 'search' in section.lower():
                protocol['search_strategy'] = section
            elif 'selection' in section.lower():
                protocol['study_selection'] = section
            elif 'extraction' in section.lower():
                protocol['data_extraction'] = section
            elif 'bias' in section.lower() or 'risk' in section.lower():
                protocol['risk_assessment'] = section
            elif 'synthesis' in section.lower():
                protocol['data_synthesis'] = section
            elif 'dissemination' in section.lower():
                protocol['dissemination'] = section

        return protocol

    def refine_protocol(self, existing_protocol: Dict[str, Any], feedback: str) -> Dict[str, Any]:
        """
        Refine an existing protocol based on user feedback
        """
        prompt = f"""
        Refine the following systematic review protocol based on this feedback:
        {feedback}

        Original protocol:
        {json.dumps(existing_protocol, indent=2)}

        Provide an updated protocol as JSON.
        """

        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are an expert in systematic review methodology. Refine protocols based on feedback while maintaining methodological rigor."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=2000,
                temperature=0.7
            )

            # Check if response has the expected structure
            if response and response.choices and len(response.choices) > 0:
                if hasattr(response.choices[0], 'message') and response.choices[0].message:
                    if hasattr(response.choices[0].message, 'content') and response.choices[0].message.content:
                        refined_text = response.choices[0].message.content
                    else:
                        refined_text = "{}"  # Empty JSON fallback
                else:
                    refined_text = "{}"  # Empty JSON fallback
            else:
                refined_text = "{}"  # Empty JSON fallback

            try:
                refined_protocol = json.loads(refined_text)
            except json.JSONDecodeError:
                refined_protocol = self._structure_protocol_text(refined_text)

            refined_protocol['refined_at'] = datetime.utcnow().isoformat()
            refined_protocol['version'] = f"{existing_protocol.get('version', '1.0')}.1"

            return refined_protocol

        except Exception as e:
            print(f"OpenAI API error in refine_protocol: {str(e)}")
            return {
                "error": f"Failed to refine protocol: {str(e)}",
                **existing_protocol
            }
