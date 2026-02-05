CREATE TABLE `price_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`channelName` varchar(255) NOT NULL,
	`oldPrice` decimal(10,2),
	`newPrice` decimal(10,2) NOT NULL,
	`oldFeePercent` decimal(5,2),
	`newFeePercent` decimal(5,2) NOT NULL,
	`changedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `price_history_id` PRIMARY KEY(`id`)
);
