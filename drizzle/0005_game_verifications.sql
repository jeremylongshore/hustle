CREATE TABLE `gameVerification` (
	`id` text PRIMARY KEY NOT NULL,
	`gameId` text NOT NULL,
	`signerRole` text NOT NULL,
	`signerName` text NOT NULL,
	`signerUserId` text,
	`method` text NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`gameId`) REFERENCES `game`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`signerUserId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `gameVerification_gameId_idx` ON `gameVerification` (`gameId`);--> statement-breakpoint
-- Backfill: every game already marked verified (parent PIN) becomes a parent co-signature.
INSERT INTO `gameVerification` (`id`, `gameId`, `signerRole`, `signerName`, `signerUserId`, `method`, `createdAt`)
SELECT
	lower(hex(randomblob(16))),
	g.`id`,
	'parent',
	COALESCE(NULLIF(TRIM(COALESCE(u.`firstName`, '') || ' ' || COALESCE(u.`lastName`, '')), ''), u.`name`, 'Parent'),
	p.`userId`,
	'pin',
	COALESCE(g.`verifiedAt`, g.`updatedAt`, g.`createdAt`)
FROM `game` g
JOIN `player` p ON p.`id` = g.`playerId`
LEFT JOIN `user` u ON u.`id` = p.`userId`
WHERE g.`verified` = 1;
