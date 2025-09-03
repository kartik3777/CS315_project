# Vehicle Management System with PostgreSQL

This project is a robust Vehicle Management System designed and implemented using **PostgreSQL**. It serves as a comprehensive backend solution for managing data related to vehicles, their owners, and service histories. The core focus of this project was to build a highly efficient, reliable, and scalable database through meticulous schema design, advanced normalization (up to BCNF), and strategic query optimization.

---

## Problem Statement

In any automotive or fleet management business, handling vast amounts of interconnected data is a significant challenge. Information about vehicles (make, model, year, VIN), owners (names, addresses, contact details), and service records (maintenance type, date, cost) needs to be stored, managed, and retrieved efficiently. An unoptimized or poorly designed database can lead to:

* **Data Redundancy:** Storing the same information (like an owner's name) in multiple places, wasting storage and creating update anomalies.
* **Data Inconsistency:** The same piece of data having different values across the database, leading to unreliable reports.
* **Poor Performance:** Slow query execution times, especially for complex requests like "find all vehicles of a specific model serviced in the last year."
* **Data Integrity Issues:** Difficulty in enforcing business rules, such as ensuring every vehicle is linked to a valid owner.

This project directly addresses these challenges by creating a database that is not only a data repository but also a well-structured, integrity-driven, and high-performance system.

---

## What This Project Does

This Vehicle Management System provides the foundational database structure to:

* **Register and Manage Owners:** Securely store and manage personal information for each vehicle owner.
* **Track Vehicle Details:** Maintain a detailed record for every vehicle, including its specifications, registration details, and its link to an owner.
* **Log Service History:** Keep a comprehensive log of all maintenance and service activities performed on each vehicle.
* **Ensure Data Integrity:** Use database constraints to guarantee that data is always consistent and valid (e.g., a service record cannot exist without a corresponding vehicle).
* **Support Complex Queries:** Efficiently execute complex transactional queries needed for business operations, such as generating reports, looking up service histories, or finding all vehicles owned by a single person.



---

## Database Design & Normalization

A key feature of this project is its highly normalized database schema, which adheres to **Boyce-Codd Normal Form (BCNF)**. Normalization is the process of organizing columns and tables in a relational database to minimize data redundancy and improve data integrity.

### How BCNF Was Achieved

We systematically progressed through the normal forms to eliminate dependencies that cause anomalies.

1.  **First Normal Form (1NF):** Ensured all table columns are atomic (hold single values) and each record is unique.
    * **Action:** Split multi-valued attributes like "service_types" into separate records in a `ServiceRecords` table.

2.  **Second Normal Form (2NF):** Removed partial dependencies. This means that every non-key attribute must be fully dependent on the entire primary key, not just a part of it.
    * **Action:** In an initial design, if we had a composite key `(vehicle_id, service_id)`, vehicle-specific details like `make` and `model` would be moved to a `Vehicles` table, as they only depend on `vehicle_id`, not the full key.

3.  **Third Normal Form (3NF):** Eliminated transitive dependencies. This ensures that no non-key attribute is dependent on another non-key attribute.
    * **Example:** Consider a table with `(vehicle_id, owner_id, owner_name, owner_address)`. Here, `owner_name` and `owner_address` are dependent on `owner_id` (a non-key attribute in this context if `vehicle_id` is the key). This is a transitive dependency.
    * **Action:** We resolved this by creating a separate `Owners` table (`owner_id`, `owner_name`, `owner_address`). The `Vehicles` table now only stores `owner_id` as a foreign key. This ensures that an owner's details are stored only once.

4.  **Boyce-Codd Normal Form (BCNF):** BCNF is a stricter version of 3NF. It requires that for every non-trivial functional dependency `X -> Y`, `X` must be a superkey.
    * **Action:** We analyzed every table to ensure no non-key attribute determines another attribute, guaranteeing that all determinants are candidate keys. This strict normalization eliminates almost all redundancy and update anomalies.

---

## SQL Schema and Relationships

The final schema consists of normalized tables with clear relationships enforced by primary and foreign key constraints.

**`Owners` Table:**
```sql
CREATE TABLE Owners (
    owner_id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    address TEXT,
    phone_number VARCHAR(15) UNIQUE
);
Vehicles Table:

SQL

CREATE TABLE Vehicles (
    vehicle_id SERIAL PRIMARY KEY,
    vin VARCHAR(17) UNIQUE NOT NULL,
    make VARCHAR(50),
    model VARCHAR(50),
    year INT,
    owner_id INT NOT NULL,
    CONSTRAINT fk_owner
        FOREIGN KEY(owner_id)
        REFERENCES Owners(owner_id)
        ON DELETE CASCADE
);
Relationship: One-to-Many (Owners to Vehicles). One owner can have multiple vehicles. ON DELETE CASCADE ensures that if an owner is deleted, all their associated vehicle records are also removed.

ServiceRecords Table:

SQL

CREATE TABLE ServiceRecords (
    service_id SERIAL PRIMARY KEY,
    vehicle_id INT NOT NULL,
    service_date DATE NOT NULL,
    service_description TEXT,
    cost NUMERIC(10, 2),
    CONSTRAINT fk_vehicle
        FOREIGN KEY(vehicle_id)
        REFERENCES Vehicles(vehicle_id)
        ON DELETE CASCADE
);
Relationship: One-to-Many (Vehicles to ServiceRecords). One vehicle can have multiple service records.
```
## Optimization & Indexing

Performance was a top priority. We engineered the system to handle queries efficiently, even as the dataset grows.

### How Queries are Optimized
Optimization was achieved by leveraging foundational relational algebra principles:

* Selection (σ): Using precise WHERE clauses to filter data at the source, reducing the number of rows processed.

* Projection (π): Selecting only the necessary columns (SELECT column1, column2) instead of using SELECT *, which minimizes data transfer.

* Joins (⨝): Structuring JOIN operations to be as efficient as possible, ensuring that smaller datasets are joined first and that conditions are applied correctly.

Example of an Optimized Query:

SQL
```
-- Find the service history for a specific vehicle by its VIN
SELECT
    s.service_date,
    s.service_description,
    s.cost
FROM
    ServiceRecords s
JOIN
    Vehicles v ON s.vehicle_id = v.vehicle_id
WHERE
    v.vin = '1HGCM82638A123456'; -- Highly selective WHERE clause
This query is efficient because it uses a JOIN on a primary key and filters using a unique, indexed column (vin).
```
How Indexing is Applied
Indexes act like a booking index, allowing the database to find data without scanning the entire table. We applied indexing strategies on columns frequently used in WHERE clauses and JOIN conditions.

Primary Key Indexes: PostgreSQL automatically creates indexes on PRIMARY KEY columns (owner_id, vehicle_id, service_id).

Foreign Key Indexes: It is best practice to index foreign keys to speed up joins.

Custom Indexes: We created indexes on other critical columns.

Example of Creating an Index:
The vin column in the Vehicles table is unique and will be used often for lookups. An index significantly speeds up these searches.

SQL
```
CREATE INDEX idx_vehicles_vin ON Vehicles(vin);
Similarly, to quickly find all vehicles belonging to an owner, an index on the owner_id foreign key in the Vehicles table is crucial.
```
SQL
```
CREATE INDEX idx_vehicles_owner_id ON Vehicles(owner_id);
These indexes dramatically reduce query execution time for common lookup and join operations, ensuring a responsive system.
```
## Authors
This project was designed and developed by:

* Mohd Nasar Siddiqui

* Kartik

* Nilesh Maheshwari
