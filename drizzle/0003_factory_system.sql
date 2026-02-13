CREATE TABLE `production_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` varchar(64) NOT NULL,
	`orderNumber` varchar(64) NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`completedQty` int NOT NULL DEFAULT 0,
	`status` enum('pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
	`priority` enum('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
	`deadline` timestamp,
	`assignedWorkers` json,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `production_orders_id` PRIMARY KEY(`id`)
);

CREATE TABLE `inventory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`materialCode` varchar(64) NOT NULL,
	`materialName` varchar(255) NOT NULL,
	`currentStock` decimal(10,2) NOT NULL DEFAULT '0',
	`unit` varchar(32) NOT NULL DEFAULT 'ซม.',
	`minStock` decimal(10,2) NOT NULL DEFAULT '0',
	`costPerUnit` decimal(10,2) NOT NULL DEFAULT '0',
	`lastRestocked` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventory_id` PRIMARY KEY(`id`)
);

CREATE TABLE `inventory_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inventoryId` int NOT NULL,
	`type` enum('in','out','adjustment') NOT NULL,
	`quantity` decimal(10,2) NOT NULL,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_transactions_id` PRIMARY KEY(`id`)
);

CREATE TABLE `workers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`role` enum('carpenter','painter','packer','supervisor','general') NOT NULL DEFAULT 'general',
	`phone` varchar(20),
	`dailyWage` decimal(10,2) NOT NULL DEFAULT '0',
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workers_id` PRIMARY KEY(`id`)
);
