# Фронтенд: робота з уроками та блоками

Інструкція для фронтенду по інтеграції з main-service: уроки (`lessons`) і блоки контенту всередині них (`blocks`).

---

## Базові правила

### Базовий URL

Усі маршрути мають глобальний префікс `api/course`:

```
http://<host>:3000/api/course
```

Swagger UI: `http://<host>:3000/docs`.

### Конверт відповіді

**Кожна** успішна відповідь обгорнута в єдиний формат:

```json
{
  "code": 200,
  "message": "Success",
  "data": { ... }
}
```

Корисні дані завжди в `data` — це або об'єкт, або масив. Завжди читайте `response.data.data`.

### Формат помилки

Помилки мають **той самий** конверт, але `data` порожній:

```json
{
  "code": 404,
  "message": "Lesson not found",
  "data": {}
}
```

`message` — рядок. При помилках валідації туди потрапляє перше повідомлення з масиву помилок.

| Код | Коли виникає |
|-----|--------------|
| `400` | Невалідне тіло запиту / нечисловий `:id` / невалідний `content` блоку / невідомий `type` |
| `404` | Урок або блок не знайдено |
| `409` | Конфлікт унікальності (напр. урок із таким `cid` уже існує) |

> ⚠️ **Авторизації зараз немає.** Поділ на `private/*` і `public/*` — лише угода про маршрутизацію, гардів немає. `public/*` — тільки читання, `private/*` — CRUD.

### Content-Type

Для `POST`/`PUT` завжди надсилайте `Content-Type: application/json`.

### CORS

Дозволені origin: `http://localhost:5173`, `https://example.com`, `credentials: true`. Якщо фронт на іншому домені — додати його в `main.ts` (`enableCors`).

---

## Частина 1. Уроки (Lessons)

Урок належить курсу (`courseId`). Має унікальний рядковий `cid` (наприклад слаг).

### Модель уроку

```ts
interface Lesson {
  id: number;
  cid: string;          // унікальний, обов'язковий
  title: string;
  description: string | null;
  icon: string | null;
  order: number;        // позиція в межах курсу; задає бекенд
  courseId: number;
}
```

> `order` керується бекендом: при створенні урок додається в кінець (`max(order)+1` у межах курсу). Не надсилайте `order` у create/update — для зміни послідовності є окремий ендпоінт (див. «Зміна порядку уроків»).

### DTO для створення / оновлення

Усі поля **обов'язкові** (валідуються глобальним `ValidationPipe`):

```ts
interface CreateLessonDto {
  cid: string;          // @IsString
  title: string;        // @IsString
  description: string;  // @IsString
  icon: string;         // @IsString
  courseId: number;     // @IsNumber
}
```

### Ендпоінти

| Метод | Шлях | Призначення |
|-------|------|-------------|
| `POST` | `/private/lesson` | Створити урок |
| `GET` | `/private/lesson/:courseId` | Усі уроки курсу (масив, відсортовано за `order`) |
| `GET` | `/private/lesson/id/:id` | Один урок за `id` |
| `GET` | `/private/lesson/cid/:cid` | Один урок за `cid` |
| `PUT` | `/private/lesson/:id` | Оновити урок |
| `PATCH` | `/private/lesson/reorder/:courseId` | Змінити порядок уроків курсу |
| `DELETE` | `/private/lesson/:id` | Видалити урок (каскадно видаляє його блоки) |

> ⚠️ Зверніть увагу: `GET /private/lesson/:id` повертає уроки **за courseId**, а не один урок. Щоб отримати конкретний урок — використовуйте `/private/lesson/id/:id` або `/private/lesson/cid/:cid`.

### Приклади

**Створити урок**

```http
POST /api/course/private/lesson
Content-Type: application/json

{
  "cid": "intro-greetings",
  "title": "Привітання",
  "description": "Базові фрази",
  "icon": "hello.png",
  "courseId": 2
}
```

Відповідь `201`:

```json
{
  "code": 201,
  "message": "Success",
  "data": {
    "id": 3,
    "cid": "intro-greetings",
    "title": "Привітання",
    "description": "Базові фрази",
    "icon": "hello.png",
    "order": 0,
    "courseId": 2
  }
}
```

**Список уроків курсу**

```http
GET /api/course/private/lesson/2
```

```json
{ "code": 200, "message": "Success", "data": [ { "id": 3, "cid": "...", ... } ] }
```

**Видалити урок** → `200`, `data: { "message": "Lesson deleted successfully" }`.

> При видаленні уроку всі його блоки видаляються каскадно (`onDelete: Cascade`).

### Зміна порядку уроків

`PATCH /private/lesson/reorder/:courseId` приймає **повний** список id уроків курсу в потрібному порядку. Індекс у масиві стає новим `order` (0, 1, 2…). Виконується атомарно в транзакції.

```http
PATCH /api/course/private/lesson/reorder/2
Content-Type: application/json

{ "lessonIds": [6, 4, 5] }
```

Відповідь `200` → актуальний масив уроків курсу, відсортований за новим `order`:

```json
{
  "code": 200,
  "message": "Success",
  "data": [
    { "id": 6, "order": 0, ... },
    { "id": 4, "order": 1, ... },
    { "id": 5, "order": 2, ... }
  ]
}
```

Правила (інакше `400`/`404`):

- `lessonIds` має бути **повною перестановкою** уроків курсу — рівно всі id, без пропусків.
- Кількість id має збігатися з кількістю уроків курсу (інакше `400`).
- Дублікати id заборонені (`400`).
- Усі id мають належати цьому курсу (`400` — `Lesson N does not belong to course M`).
- Порожній масив заборонений (`400`); курс без уроків → `404`.

> Для drag-and-drop у списку уроків: після перетягування відправте поточний порядок id одним `PATCH`-запитом.

---

## Частина 2. Блоки (Blocks)

Блок — одиниця контенту всередині уроку. Має `type` (один із 10 типів) і `content` (JSON, форма залежить від `type`). Поле `order` визначає послідовність у межах уроку (керується бекендом).

### Модель блоку

```ts
interface Block {
  id: number;
  lessonId: number;
  order: number;                 // 0,1,2... — задає бекенд
  type: BlockType;
  title: string | null;
  content: Record<string, unknown>;   // форма залежить від type (див. нижче)
}
```

### DTO для створення / оновлення блоку

```ts
interface CreateBlockDto {
  type: BlockType;              // @IsEnum — обов'язкове
  title?: string;               // опціональне
  content: Record<string, unknown>;  // обов'язкове, валідується по type
}
```

`order` **не** надсилається при створенні — бекенд ставить блок у кінець (`max(order)+1`).

### Ендпоінти

| Метод | Шлях | Призначення |
|-------|------|-------------|
| `POST` | `/private/lesson/:lessonId/blocks` | Створити блок в уроці |
| `GET` | `/private/lesson/:lessonId/blocks` | Список блоків уроку (відсортовано за `order`) |
| `PUT` | `/private/lesson/:lessonId/blocks` | **Sync** — повна синхронізація блоків уроку |
| `GET` | `/public/lesson/:lessonId/blocks` | Публічний список блоків (read-only, для клієнта) |
| `GET` | `/private/block/:id` | Один блок за `id` |
| `PUT` | `/private/block/:id` | Оновити один блок |
| `DELETE` | `/private/block/:id` | Видалити один блок |

### Створення блоку

```http
POST /api/course/private/lesson/3/blocks
Content-Type: application/json

{
  "type": "MARKDOWN",
  "title": "Вступ",
  "content": { "text": "# Привіт" }
}
```

Відповідь `201` → об'єкт `Block` із присвоєними `id` та `order`.

### Оновлення одного блоку

```http
PUT /api/course/private/block/7
Content-Type: application/json

{ "type": "MARKDOWN", "title": "Вступ (ред.)", "content": { "text": "# Оновлено" } }
```

`type` і `content` обов'язкові і знову валідуються. (Зміна `order` через цей ендпоінт не передбачена — для перевпорядкування використовуйте Sync.)

### Sync — рекомендований спосіб для редактора уроку

`PUT /private/lesson/:lessonId/blocks` приймає **весь** масив блоків уроку і за одну транзакцію:

- **створює** блоки без `id`;
- **оновлює** блоки з наявним `id`;
- **видаляє** блоки, яких немає в масиві;
- **перезаписує `order`** = індексу в масиві (тобто порядок у масиві = порядок на бекенді).

Існуючі `id` зберігаються (важливо, щоб не осиротити історію відповідей користувачів).

```http
PUT /api/course/private/lesson/3/blocks
Content-Type: application/json

{
  "blocks": [
    { "id": 7, "type": "MARKDOWN", "title": "Вступ", "content": { "text": "# Привіт" } },
    { "type": "FILL_IN_BLANK", "content": { "text": "Небо ___", "correctAnswer": "блакитне" } }
  ]
}
```

- Блок із `id: 7` — оновиться, стане `order: 0`.
- Блок без `id` — створиться, стане `order: 1`.
- Усі інші блоки уроку, що були раніше, — видаляться.

Відповідь `200` → актуальний масив блоків уроку, відсортований за `order`.

> ⚠️ Якщо в payload передати `id`, який не належить цьому уроку — `400` (`Block N does not belong to lesson M`).

---

## Типи блоків і форма `content`

`content` валідується на бекенді **по типу**. Невідповідність формі → `400`.

| `type` | Поля `content` |
|--------|----------------|
| `MARKDOWN` | `text: string` |
| `ONE_TRUE_CHOICE` | `question: string`, `options: string[]` (мін. 2), `correctAnswer: string` |
| `FILL_IN_BLANK` | `text: string`, `correctAnswer: string` |
| `MANUAL_ANSWER` | `text: string`, `correctAnswer: string` |
| `BUILD_SENTENCE` | `words: string[]`, `correctOrder: number[]` |
| `TRANSLATION` | `text: string`, `translateTo: string`, `correctAnswer: string` |
| `MATCHING` | `pairs: { left: string; right: string }[]` |
| `DIALOGUE` | `dialogue: unknown[]`, `questions: { question: string; correctAnswer: string }[]` |
| `REPHRASING` | `text: string`, `correctAnswer: string` |
| `ERROR_CORRECTION` | `text: string`, `errorText: string`, `correctAnswer: string` |

### TypeScript-типи контенту

```ts
type BlockType =
  | 'MARKDOWN'
  | 'ONE_TRUE_CHOICE'
  | 'FILL_IN_BLANK'
  | 'MANUAL_ANSWER'
  | 'BUILD_SENTENCE'
  | 'TRANSLATION'
  | 'MATCHING'
  | 'DIALOGUE'
  | 'REPHRASING'
  | 'ERROR_CORRECTION';

interface MarkdownContent        { text: string }
interface OneTrueChoiceContent   { question: string; options: string[]; correctAnswer: string }
interface FillInBlankContent     { text: string; correctAnswer: string }
interface ManualAnswerContent    { text: string; correctAnswer: string }
interface BuildSentenceContent   { words: string[]; correctOrder: number[] }
interface TranslationContent     { text: string; translateTo: string; correctAnswer: string }
interface MatchingContent        { pairs: { left: string; right: string }[] }
interface DialogueContent        { dialogue: unknown[]; questions: { question: string; correctAnswer: string }[] }
interface RephrasingContent      { text: string; correctAnswer: string }
interface ErrorCorrectionContent { text: string; errorText: string; correctAnswer: string }
```

### Приклади `content` кожного типу

```jsonc
// MARKDOWN
{ "text": "# Заголовок\n\nТекст уроку." }

// ONE_TRUE_CHOICE
{ "question": "2+2?", "options": ["3", "4", "5"], "correctAnswer": "4" }

// FILL_IN_BLANK
{ "text": "Небо ___", "correctAnswer": "блакитне" }

// MANUAL_ANSWER
{ "text": "Що таке іменник?", "correctAnswer": "частина мови" }

// BUILD_SENTENCE
{ "words": ["I", "am", "here"], "correctOrder": [0, 1, 2] }

// TRANSLATION
{ "text": "hello", "translateTo": "uk", "correctAnswer": "привіт" }

// MATCHING
{ "pairs": [{ "left": "cat", "right": "кіт" }, { "left": "dog", "right": "пес" }] }

// DIALOGUE
{ "dialogue": ["A: Hi", "B: Hello"], "questions": [{ "question": "Хто привітався першим?", "correctAnswer": "A" }] }

// REPHRASING
{ "text": "big", "correctAnswer": "large" }

// ERROR_CORRECTION
{ "text": "He go to school", "errorText": "go", "correctAnswer": "goes" }
```

---

## Типовий сценарій фронтенду

1. **Сторінка курсу** → `GET /private/lesson/:courseId` — отримати список уроків.
2. **Створити урок** → `POST /private/lesson`.
3. **Редактор уроку** → `GET /private/lesson/:lessonId/blocks` — підвантажити блоки.
4. **Зберегти зміни блоків** (додавання/редагування/видалення/перевпорядкування) → один `PUT /private/lesson/:lessonId/blocks` (Sync) з повним масивом у потрібному порядку.
5. **Перегляд для учня** → `GET /public/lesson/:lessonId/blocks`.

> Для редактора використовуйте **Sync** замість поодиноких create/update/delete — це атомарно й коректно перевпорядковує `order`.

---

## Приклад API-клієнта (fetch)

```ts
const API = 'http://localhost:3000/api/course';

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  const body = await res.json(); // { code, message, data }
  if (!res.ok) throw new Error(body.message ?? 'Request failed');
  return body.data as T;
}

// Уроки
export const getLessonsByCourse = (courseId: number) =>
  api<Lesson[]>(`/private/lesson/${courseId}`);

export const getLessonById = (id: number) =>
  api<Lesson>(`/private/lesson/id/${id}`);

export const createLesson = (dto: CreateLessonDto) =>
  api<Lesson>('/private/lesson', { method: 'POST', body: JSON.stringify(dto) });

export const updateLesson = (id: number, dto: CreateLessonDto) =>
  api<Lesson>(`/private/lesson/${id}`, { method: 'PUT', body: JSON.stringify(dto) });

export const deleteLesson = (id: number) =>
  api<{ message: string }>(`/private/lesson/${id}`, { method: 'DELETE' });

// Зміна порядку уроків курсу: lessonIds — повний список id у потрібному порядку
export const reorderLessons = (courseId: number, lessonIds: number[]) =>
  api<Lesson[]>(`/private/lesson/reorder/${courseId}`, {
    method: 'PATCH',
    body: JSON.stringify({ lessonIds }),
  });

// Блоки
export const getBlocks = (lessonId: number) =>
  api<Block[]>(`/private/lesson/${lessonId}/blocks`);

export const getBlocksPublic = (lessonId: number) =>
  api<Block[]>(`/public/lesson/${lessonId}/blocks`);

export const createBlock = (lessonId: number, dto: CreateBlockDto) =>
  api<Block>(`/private/lesson/${lessonId}/blocks`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });

export const updateBlock = (id: number, dto: CreateBlockDto) =>
  api<Block>(`/private/block/${id}`, { method: 'PUT', body: JSON.stringify(dto) });

export const deleteBlock = (id: number) =>
  api<{ message: string }>(`/private/block/${id}`, { method: 'DELETE' });

// Sync усіх блоків уроку (рекомендовано для редактора)
export const syncBlocks = (lessonId: number, blocks: BlockItem[]) =>
  api<Block[]>(`/private/lesson/${lessonId}/blocks`, {
    method: 'PUT',
    body: JSON.stringify({ blocks }),
  });

// BlockItem = CreateBlockDto + опціональний id (для оновлення наявних блоків)
type BlockItem = CreateBlockDto & { id?: number };
```
