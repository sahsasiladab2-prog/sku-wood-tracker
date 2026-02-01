CREATE TABLE `projects` (
	`id` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`productionType` enum('Outsource','In-House') NOT NULL DEFAULT 'Outsource',
	`note` text,
	`materials` json,
	`carpenterCost` decimal(10,2) DEFAULT '0',
	`paintingCost` decimal(10,2) DEFAULT '0',
	`packingCost` decimal(10,2) DEFAULT '0',
	`wasteCost` decimal(10,2) DEFAULT '0',
	`channels` json,
	`totalCost` decimal(10,2) DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
