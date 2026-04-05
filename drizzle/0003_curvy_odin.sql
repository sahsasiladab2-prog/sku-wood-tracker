CREATE TABLE `wood_materials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(64) NOT NULL,
	`description` varchar(255) NOT NULL,
	`unit` varchar(32) NOT NULL DEFAULT 'ซม.',
	`refQty` int NOT NULL DEFAULT 100,
	`cost` decimal(10,2) NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wood_materials_id` PRIMARY KEY(`id`),
	CONSTRAINT `wood_materials_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `wood_price_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`woodCode` varchar(64) NOT NULL,
	`oldPrice` decimal(10,2),
	`newPrice` decimal(10,2) NOT NULL,
	`changedAt` timestamp NOT NULL DEFAULT (now()),
	`note` text,
	CONSTRAINT `wood_price_history_id` PRIMARY KEY(`id`)
);
