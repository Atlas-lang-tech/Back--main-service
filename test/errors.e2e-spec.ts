import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { API, cleanDb, createTestApp } from './setup-app.js';
import { PrismaService } from '../src/modules/Prisma/prisma.service.js';

describe('Error handling (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
  });

  beforeEach(async () => {
    await cleanDb(prisma);
  });

  afterAll(async () => {
    await cleanDb(prisma);
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  it('returns 409 on a duplicate language code', async () => {
    await http()
      .post(`${API}/private/language`)
      .send({ name: 'English', code: 'en' })
      .expect(201);

    const dup = await http()
      .post(`${API}/private/language`)
      .send({ name: 'English (US)', code: 'en' })
      .expect(409);

    expect(dup.body.code).toBe(409);
  });

  it('returns 404 for a non-existent course id', async () => {
    const res = await http().get(`${API}/private/course/999999`).expect(404);
    expect(res.body.code).toBe(404);
  });

  it('returns 400 for a non-numeric id (ParseIntPipe)', async () => {
    await http().get(`${API}/private/course/not-a-number`).expect(400);
  });

  it('returns 400 when block content is invalid for its type', async () => {
    const lang = await http()
      .post(`${API}/private/language`)
      .send({ name: 'Spanish', code: 'es' });
    const lvl = await http()
      .post(`${API}/private/language/level/${lang.body.data.id}`)
      .send({ name: 'A1' });
    const course = await http().post(`${API}/private/course`).send({
      cid: 'course-e',
      title: 'C',
      description: 'd',
      icon: 'i',
      languageId: lang.body.data.id,
      languageLvlId: lvl.body.data.id,
    });
    const lesson = await http().post(`${API}/private/lesson`).send({
      cid: 'lesson-e',
      title: 'L',
      description: 'd',
      icon: 'i',
      courseId: course.body.data.id,
    });

    // MARKDOWN requires a string `text` — number must be rejected with 400.
    const res = await http()
      .post(`${API}/private/lesson/${lesson.body.data.id}/blocks`)
      .send({ type: 'MARKDOWN', content: { text: 123 } })
      .expect(400);
    expect(res.body.code).toBe(400);
  });
});
