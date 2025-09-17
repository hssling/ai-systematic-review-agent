import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const batch2025 = await prisma.batch.upsert({
    where: { id: "seed-batch-2025" },
    update: {},
    create: {
      id: "seed-batch-2025",
      name: "MBBS 2025",
      phase: "I",
      year: 2025,
      students: 200,
    },
  });

  const anatomy = await prisma.subject.create({
    data: { name: "Anatomy", phase: "I", batchId: batch2025.id },
  });
  const physiology = await prisma.subject.create({
    data: { name: "Physiology", phase: "I", batchId: batch2025.id },
  });
  const biochem = await prisma.subject.create({
    data: { name: "Biochemistry", phase: "I", batchId: batch2025.id },
  });

  const comps = [
    {
      code: "AN 1.1",
      title: "Describe anatomical terminology",
      description: "Anatomical planes, axes, terms of position and movement",
      domain: "Knowledge",
      millerLevel: "Knows",
      phase: "I",
      subject: "Anatomy",
      mustKnow: true,
    },
    {
      code: "PY 1.1",
      title: "Explain cell membrane and transport",
      description: "Structure-function and transport mechanisms",
      domain: "Knowledge",
      millerLevel: "Knows",
      phase: "I",
      subject: "Physiology",
      mustKnow: true,
    },
    {
      code: "AT 1.1",
      title: "Demonstrate respect and empathy (AETCOM)",
      description: "Professionalism and communication basics",
      domain: "Attitude",
      millerLevel: "ShowsHow",
      phase: "I",
      subject: "AETCOM",
      mustKnow: true,
    },
  ];

  for (const c of comps) {
    await prisma.competency.upsert({
      where: { code: c.code },
      update: c,
      create: c,
    });
  }

  // Seed tags separately
  const seeded = await prisma.competency.findMany({ where: { code: { in: ["AN 1.1", "PY 1.1", "AT 1.1"] } } });
  for (const c of seeded) {
    const defaultTags = c.code === "AT 1.1" ? ["AETCOM"] : ["MustKnow"];
    for (const t of defaultTags) {
      await prisma.competencyTag.create({ data: { competencyId: c.id, value: t } });
    }
  }

  const teachers = [
    { name: "Dr. Rao", email: "rao@example.edu", dept: "Anatomy" },
    { name: "Dr. Mehta", email: "mehta@example.edu", dept: "Physiology" },
  ];
  for (const t of teachers) {
    await prisma.teacher.upsert({
      where: { email: t.email },
      update: t,
      create: t,
    });
  }

  console.log("Seeded batches, subjects, competencies, teachers.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

