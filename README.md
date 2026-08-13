# Doctor Tracker API - Backend Server

This repository contains the standalone, secure administrative REST API for the **Doctor Tracker** portal. It is built using Node.js, Express, and MongoDB/Mongoose, providing robust administrative authentication, doctor records management, and patient record cataloging.

---

## 1. Technology Stack

* **Runtime**: [Node.js (v18+)](https://nodejs.org/)
* **Framework**: [Express.js](https://expressjs.com/) (RESTful design, custom middleware router guards)
* **Database**: [MongoDB Atlas](https://www.mongodb.com/atlas/database)
* **ORM**: [Mongoose](https://mongoosejs.com/) (Schema modeling, casting, compound and text indexing)
* **Security**:
  * [JSON Web Tokens (JWT)](https://jwt.io/) (Stateless authorization signatures)
  * [bcryptjs](https://github.com/dcodeIO/bcrypt.js) (Salting and blowfish-hashing of admin passwords)
  * [CORS](https://github.com/expressjs/cors) (Safe cross-origin sharing rules)

---

## 2. Database Models & Indexing

The API enforces strict data schemas and indexes for efficiency and security:

### Admin Model (`models/Admin.js`)
* **Fields**: `name`, `email` (unique, lowercase), `password` (hashed).
* **Indexes**: Single-field unique index on `email` to accelerate authentication queries.

### Doctor Model (`models/Doctor.js`)
* **Fields**: `name`, `specialization`, `hospital`, `email` (unique), `phone`, `patients` (Array of ObjectIds referencing Patient).
* **Indexes**: 
  * Compound index on `{ specialization: 1, hospital: 1 }` to optimize filter queries.
  * Unique index on `email` to prevent duplication.

### Patient Model (`models/Patient.js`)
* **Fields**: `name`, `age`, `gender`, `condition`, `assignedDoctor` (ObjectId referencing Doctor), `admittedDate`.
* **Indexes**:
  * Text index on `{ name: "text", condition: "text" }` to support efficient fuzzy search querying.
  * Single-field index on `admittedDate` to speed up daily trend calculations.

---

## 3. API Endpoints Reference

### Authentication Routes (`/api/auth`)

#### `POST /api/auth/login`
* **Description**: Verifies credentials and issues a JWT token.
* **Request Body**:
  ```json
  {
    "email": "admin@doctortracker.com",
    "password": "admin123"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "admin": {
      "id": "60d000000000000000000001",
      "name": "System Administrator",
      "email": "admin@doctortracker.com"
    }
  }
  ```

#### `GET /api/auth/me`
* **Description**: Gets the current authenticated administrator's details.
* **Headers**: `Authorization: Bearer <token>`
* **Success Response (200 OK)**:
  ```json
  {
    "id": "60d000000000000000000001",
    "name": "System Administrator",
    "email": "admin@doctortracker.com"
  }
  ```

---

### Doctor Management Routes (`/api/doctors`)
*(All routes require a valid `Authorization: Bearer <token>` header)*

#### `GET /api/doctors`
* **Description**: Retrieves list of all doctors. Filterable by `specialization` and `hospital`.
* **Success Response (200 OK)**:
  ```json
  [
    {
      "_id": "60d000000000000000000002",
      "name": "Dr. Sarah Connor",
      "specialization": "Cardiology",
      "hospital": "Metro General Hospital",
      "email": "sarah.connor@metro.com",
      "phone": "+1 (555) 123-4567",
      "patients": []
    }
  ]
  ```

#### `POST /api/doctors`
* **Description**: Creates a new doctor.
* **Request Body**:
  ```json
  {
    "name": "Dr. Sarah Connor",
    "specialization": "Cardiology",
    "hospital": "Metro General Hospital",
    "email": "sarah.connor@metro.com",
    "phone": "+1 (555) 123-4567"
  }
  ```

#### `PUT /api/doctors/:id`
* **Description**: Updates an existing doctor's details.
* **Request Body**:
  ```json
  {
    "name": "Dr. Sarah Connor",
    "specialization": "Cardiology",
    "hospital": "City General Hospital",
    "phone": "+1 (555) 987-6543",
    "email": "sarah.connor@citygeneral.com"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "_id": "60d000000000000000000002",
    "name": "Dr. Sarah Connor",
    "specialization": "Cardiology",
    "hospital": "City General Hospital",
    "phone": "+1 (555) 987-6543",
    "email": "sarah.connor@citygeneral.com",
    "createdAt": "2026-08-10T12:00:00.000Z",
    "updatedAt": "2026-08-13T22:15:00.000Z"
  }
  ```

#### `DELETE /api/doctors/:id`
* **Description**: Deletes a doctor and performs a cascade deletion of all assigned patient records.
* **Success Response (200 OK)**:
  ```json
  {
    "message": "Doctor and assigned patients successfully deleted"
  }
  ```


---

### Patient Management Routes (`/api/patients`)
*(All routes require a valid `Authorization: Bearer <token>` header)*

#### `GET /api/patients`
* **Description**: Retrieves and searches patients. Filterable by text search (`q`), `condition`, `gender`, and date range (`startDate`/`endDate`). Supports pagination.
* **Success Response (200 OK)**:
  ```json
  {
    "patients": [
      {
        "_id": "60d000000000000000000010",
        "name": "John Doe",
        "age": 45,
        "gender": "Male",
        "condition": "Hypertension",
        "assignedDoctor": {
          "_id": "60d000000000000000000002",
          "name": "Dr. Sarah Connor"
        },
        "admittedDate": "2026-08-10T00:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "pages": 1
  }
  ```

#### `POST /api/patients`
* **Description**: Creates a patient and assigns them to a doctor.
* **Request Body**:
  ```json
  {
    "name": "John Doe",
    "age": 45,
    "gender": "Male",
    "condition": "Hypertension",
    "assignedDoctor": "60d000000000000000000002",
    "admittedDate": "2026-08-10T00:00:00.000Z"
  }
  ```

#### `PUT /api/patients/:id`
* **Description**: Updates a patient (re-assigning doctor reference automatically if changed).

#### `DELETE /api/patients/:id`
* **Description**: Deletes a patient and removes the patient reference from the corresponding doctor.

---

### Dashboard Aggregations (`/api/dashboard`)
*(All routes require a valid `Authorization: Bearer <token>` header)*

#### `GET /api/dashboard/stats`
* **Description**: Aggregates top-level cards (Total Doctors, Total Patients, Average Patients per Doctor).
* **Success Response (200 OK)**:
  ```json
  {
    "totalDoctors": 5,
    "totalPatients": 20,
    "avgPatientsPerDoctor": 4.0
  }
  ```

#### `GET /api/dashboard/trend`
* **Description**: Aggregates patient admissions grouped by date over the last 30 days.
* **Success Response (200 OK)**:
  ```json
  [
    { "_id": "2026-08-10", "count": 3 },
    { "_id": "2026-08-11", "count": 5 }
  ]
  ```

#### `GET /api/dashboard/specializations`
* **Description**: Aggregates patient load grouped by doctor specializations.
* **Success Response (200 OK)**:
  ```json
  [
    { "specialization": "Cardiology", "patientCount": 12 },
    { "specialization": "Pediatrics", "patientCount": 8 }
  ]
  ```

---

## 4. Setup & Running Instructions

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher installed)
* MongoDB connection string (local instance or MongoDB Atlas cluster)

### Installation
1. Clone this repository to your backend host.
2. Install dependencies:
   ```bash
   npm install
   ```

### Configuration (`.env`)
Create a `.env` file in the root folder of the backend project:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_signature_secret_key
NODE_ENV=production
```

### Seeding the Database
To reset the database and seed initial admin credentials (`admin@doctortracker.com` / `admin123`) along with mock doctors and patient records, run:
```bash
npm run seed
```

### Starting the Server
* **Development Mode** (auto-restart on changes):
  ```bash
  npm run dev
  ```
* **Production Mode**:
  ```bash
  npm start
  ```
