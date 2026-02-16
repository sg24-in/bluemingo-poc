# **Bill of Distribution (BOD)**

## **Functional & Technical Specification Document**

## **1\. Introduction**

This document defines the functionality, business rules, data flow, and technical behavior of the Bill of Distribution (BOD) module.

The module allows users to:

• View distribution mappings in a grid

• Filter and sort data

• Add / Update / Delete single records

• Upload data via Excel

• Download data in Excel format

• Delete all records

• Manage records using a form below the grid

## **2\. Unique Key Definition**

A record is uniquely identified by the following composite key:

• FromDistributionLevel

• SourceCode

• ToDistributionCode

• DestinationCode

• ModeId

## **3\. Screen Layout**

Action Bar: Add | Delete All | Upload | Download

Data Grid: Filter and Sort Enabled

Form Section: Add / Edit Record Below Grid

## **4\. Grid Functionality**

• Column-level filtering

• Ascending / Descending sorting

• Pagination for large data

• Row selection for editing

• Real-time refresh after operations

## **5\. Form Functionality**

Add Mode:

• Triggered on Add button click

• Clears form fields

• Save performs delete (if exists) \+ insert

Edit Mode:

• Triggered on row click

• Populates form with selected data

• Update performs delete \+ insert

Delete Single Record:

• Confirmation required

• Deletes record using composite key

## **6\. Delete All Functionality**

• Deletes all records from table

• Confirmation required before execution

• Uses DELETE or TRUNCATE based on audit requirement

## **7\. Upload Functionality**

• Only .xlsx file allowed

• Same template as download

• For each row: Validate → Delete existing → Insert new

• Entire upload runs in single transaction

• Rollback on failure

## **8\. Download Functionality**

• Downloads data in Excel (.xlsx)

• Headers match UI grid

• Includes filtered data if applied

## **9\. Database Design**

Table: BOD\_Mode

 \`BOD\_Mode\_ID\` int NOT NULL AUTO\_INCREMENT,

  \`createdBy\` varchar(255) DEFAULT NULL,

  \`createdDate\` datetime DEFAULT NULL,

  \`updatedBy\` varchar(255) DEFAULT NULL,

  \`updatedDate\` datetime DEFAULT NULL,

  \`Cost\_Per\_Kg\` double DEFAULT NULL,

  \`Cost\_Per\_Kg\_Per\_Km\` double DEFAULT NULL,

  \`Cost\_Per\_Km\` double DEFAULT NULL,

  \`Data\_Version\_ID\` int DEFAULT NULL,

  \`Distance\` double NOT NULL,

  \`Freight\_Cost\` double NOT NULL,

  \`From\_Consumer\_ID\` int DEFAULT NULL,

  \`From\_Distribution\_Level\_ID\` int DEFAULT NULL,

  \`From\_Distributor\_ID\` int DEFAULT NULL,

  \`From\_Factory\_ID\` int DEFAULT NULL,

  \`From\_Retailer\_ID\` int DEFAULT NULL,

  \`From\_Supplier\_ID\` int DEFAULT NULL,

  \`From\_Warehouse\_ID\` int DEFAULT NULL,

  \`is\_block\` int NOT NULL,

  \`Lane\_Fixed\_Cost\` double DEFAULT NULL,

  \`Lead\_Time\` double NOT NULL,

  \`Lead\_Time\_Variability\` double NOT NULL,

  \`Min\_Distance\` double DEFAULT NULL,

  \`Min\_Weight\` double DEFAULT NULL,

  \`Mode\_ID\` int DEFAULT NULL,

  \`REf\_Bod\_Mode\_ID\` int DEFAULT NULL,

  \`activeStatus\` int DEFAULT '1',

  \`txnAccessCode\` int DEFAULT NULL,

  \`To\_Consumer\_ID\` int DEFAULT NULL,

  \`To\_Distribution\_Level\_ID\` int DEFAULT NULL,

  \`To\_Distributor\_ID\` int DEFAULT NULL,

  \`To\_Factory\_ID\` int DEFAULT NULL,

  \`To\_Retailer\_ID\` int DEFAULT NULL,

  \`To\_Supplier\_ID\` int DEFAULT NULL,

  \`To\_Warehouse\_ID\` int DEFAULT NULL,

  \`Variable\_Cost\_Distance\` double DEFAULT NULL,

  \`Variable\_Cost\_LeadTime\` double DEFAULT NULL,

  \`versionId\` int DEFAULT NULL,

  \`Rate\_Reference\_Key\` varchar(255) DEFAULT NULL,

  PRIMARY KEY (\`BOD\_Mode\_ID\`)

## **10\. Business Rules Summary**

• Unique record defined by 5 key fields

• Upload and Single Save follow same logic

• Delete All removes complete data

• All operations are transactional

• Role-based access control required

## **11\. Performance Considerations**

• Use pagination for large datasets

• Use indexed unique key

• Batch processing during upload

• Avoid row-by-row database calls

| Column Name | Source Table | Source Column | Condition / Logic | Validation Rules |
| :---: | :---: | :---: | :---: | :---: |
| From Distribution Level | Distribution\_Level | Distribution\_Level\_Name | JOIN on (BOD\_Mode)bm.From\_Distribution\_Level\_ID | Mandatory. Must exist in Distribution Level Master. |
| Source Code | Factory / Warehouse\_CFA / Distributor / Consumer / Supplier | Factory\_Code / Warehouse\_Code / Distributor\_Code / Consumer\_Code / Supplier\_Code | Based on (BOD\_Mode)bm.From\_Distribution\_Level\_ID | Mandatory. Must exist in Distribution Level Master based on Distribution Level. |
| Source Name | Factory / Warehouse\_CFA / Distributor / Consumer / Supplier | Factory\_Name / Warehouse\_Name / Distributor\_Name / Consumer\_Name / Supplier\_Name | Based on (BOD\_Mode)bm.From\_Distribution\_Level\_ID |  |
| To Distribution Level | Distribution\_Level | Distribution\_Level\_Name | JOIN on(BOD\_Mode) bm.To\_Distribution\_Level\_ID | Mandatory. Must exist in Distribution Level Master. |
| Destination Code | Factory / Warehouse\_CFA / Distributor / Consumer / Supplier | Factory\_Code / Warehouse\_Code / Distributor\_Code / Consumer\_Code / Supplier\_Code | CASE WHEN bm.To\_Distribution\_Level\_ID (At the bottom case statement Printed) | Mandatory. Must exist in Distribution Level Master based on Distribution Level. |
| Destination Name | Factory / Warehouse\_CFA / Distributor / Consumer / Supplier | Factory\_Name / Warehouse\_Name / Distributor\_Name / Consumer\_Name / Supplier\_Name | CASE WHEN bm.To\_Distribution\_Level\_ID (At the bottom case statement Printed) |  |
| Freight Cost | BOD\_Mode | Freight\_Cost | Direct column | Mandatory. Must be numeric (Double). Cannot be negative. |
| Mode Code | ModeTable | Mode\_Code | JOIN ModeTable ON bm.Mode\_ID(BOD\_Mode) | Mandatory. Must exist in ModeTable Master. |
| Lead Time | BOD\_Mode | Lead\_Time | Direct column | Mandatory. Must be numeric (Double). Cannot be negative. |
| Lead Time Variability | BOD\_Mode | Lead\_Time\_Variability | Direct column | Mandatory. Must be numeric (Double). Cannot be negative. |
| Distance | BOD\_Mode | Distance | Direct column | Optional. Must be numeric if provided. |
| Is Block | BOD\_Mode | is\_block | Direct column and have case statement when is block is 1 then 1 Or it is 0 ) | Optional. Allowed values: Yes or No. Default is No. |
| Min Weight | BOD\_Mode | Min\_Weight | Direct column | Optional. Must be numeric if provided. |
| Cost Per Kg Per Km | BOD\_Mode | Cost\_Per\_Kg\_Per\_Km | Direct column | Optional. Must be numeric if provided. |
| Min Distance | BOD\_Mode | Min\_Distance | Direct column | Optional. Must be numeric if provided. |
| Cost Per Kg | BOD\_Mode | Cost\_Per\_Kg | Direct column | Optional. Must be numeric if provided. |
| Cost Per Km | BOD\_Mode | Cost\_Per\_Km | Direct column | Optional. Must be numeric if provided. |
| Filter Condition | BOD\_Mode | Data\_Version\_ID | WHERE bm.Data\_Version\_ID \= \-1 |  |

**12.Table Structure**

