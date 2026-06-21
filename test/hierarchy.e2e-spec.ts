import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { API, cleanDb, createTestApp } from './setup-app.js';
import { PrismaService } from '../src/modules/Prisma/prisma.service.js';

describe('Content hierarchy (e2e)', () => {
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

  // e2e requests run as an admin: the private course/lesson/block routes are
  // guarded by UserContextGuard + RolesGuard([ADMIN]). Default headers mimic
  // what Traefik ForwardAuth injects.
  const http = () =>
    request
      .agent(app.getHttpServer())
      .set('X-User-Id', 'e2e-admin')
      .set('X-User-Role', 'ADMIN');

  it('creates language → level → category → course → lesson → block and reads them back', async () => {
    // Language
    const lang = await http()
      .post(`${API}/private/language`)
      .send({ name: 'English', code: 'en' })
      .expect(201);
    expect(lang.body).toMatchObject({ message: 'Success' });
    const languageId = lang.body.data.id;

    // Language level (nested under the language id)
    const lvl = await http()
      .post(`${API}/private/language/level/${languageId}`)
      .send({ name: 'A1' })
      .expect(201);
    const languageLvlId = lvl.body.data.id;

    // Category
    const cat = await http()
      .post(`${API}/private/category`)
      .send({ name: 'Grammar' })
      .expect(201);
    const categoryId = cat.body.data.id;

    // Course
    const course = await http()
      .post(`${API}/private/course`)
      .send({
        cid: 'course-1',
        title: 'Beginner English',
        description: 'desc',
        icon: 'icon',
        languageId,
        languageLvlId,
        categoryId,
      })
      .expect(201);
    const courseId = course.body.data.id;

    // Lesson (order auto-assigned to 0)
    const lesson = await http()
      .post(`${API}/private/lesson`)
      .send({
        cid: 'lesson-1',
        title: 'Lesson One',
        description: 'desc',
        icon: 'icon',
        courseId,
      })
      .expect(201);
    expect(lesson.body.data.order).toBe(0);
    const lessonId = lesson.body.data.id;

    // Block
    const block = await http()
      .post(`${API}/private/lesson/${lessonId}/blocks`)
      .send({ type: 'MARKDOWN', title: 'Intro', content: { text: '# Hi' } })
      .expect(201);
    expect(block.body.data.order).toBe(0);

    // Read back through public endpoints
    const courses = await http().get(`${API}/public/course`).expect(200);
    expect(courses.body.data).toHaveLength(1);

    const byCid = await http()
      .get(`${API}/public/course/cid/course-1`)
      .expect(200);
    expect(byCid.body.data.id).toBe(courseId);

    const lessons = await http()
      .get(`${API}/private/lesson/${courseId}`)
      .expect(200);
    expect(lessons.body.data).toHaveLength(1);

    const blocks = await http()
      .get(`${API}/public/lesson/${lessonId}/blocks`)
      .expect(200);
    expect(blocks.body.data).toHaveLength(1);
    expect(blocks.body.data[0].content).toEqual({ text: '# Hi' });
  });

  it('reorders lessons within a course', async () => {
    const lang = await http()
      .post(`${API}/private/language`)
      .send({ name: 'German', code: 'de' });
    const lvl = await http()
      .post(`${API}/private/language/level/${lang.body.data.id}`)
      .send({ name: 'A1' });
    const course = await http().post(`${API}/private/course`).send({
      cid: 'course-r',
      title: 'C',
      description: 'd',
      icon: 'i',
      languageId: lang.body.data.id,
      languageLvlId: lvl.body.data.id,
    });
    const courseId = course.body.data.id;

    const ids: number[] = [];
    for (const cid of ['l-a', 'l-b', 'l-c']) {
      const l = await http()
        .post(`${API}/private/lesson`)
        .send({ cid, title: cid, description: 'd', icon: 'i', courseId });
      ids.push(l.body.data.id);
    }

    const reversed = [...ids].reverse();
    const res = await http()
      .patch(`${API}/private/lesson/reorder/${courseId}`)
      .send({ lessonIds: reversed })
      .expect(200);

    expect(res.body.data.map((l: { id: number }) => l.id)).toEqual(reversed);
    expect(res.body.data.map((l: { order: number }) => l.order)).toEqual([
      0, 1, 2,
    ]);
  });
});
