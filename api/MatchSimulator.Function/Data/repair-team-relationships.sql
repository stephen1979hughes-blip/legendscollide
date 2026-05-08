-- SQL Script to repair TeamId relationships for classic teams
-- Run this in SQLite Browser to fix players that should be linked to teams but aren't

-- Manchester United 1968
UPDATE Players SET TeamId = 'man-utd-1968' WHERE Id IN ('mu-1', 'mu-2', 'mu-3', 'mu-4', 'mu-5', 'mu-6', 'mu-7', 'mu-8', 'mu-9', 'mu-10', 'mu-11');

-- Liverpool 1984
UPDATE Players SET TeamId = 'liverpool-1984' WHERE Id IN ('lfc-1', 'lfc-2', 'lfc-3', 'lfc-4', 'lfc-5', 'lfc-6', 'lfc-7', 'lfc-8', 'lfc-9', 'lfc-10', 'lfc-11');

-- Brazil 1970
UPDATE Players SET TeamId = 'brazil-1970' WHERE Id IN ('bra-1', 'bra-2', 'bra-3', 'bra-4', 'bra-5', 'bra-6', 'bra-7', 'bra-8', 'bra-9', 'bra-10', 'bra-11');

-- Barcelona 2011
UPDATE Players SET TeamId = 'barcelona-2011' WHERE Id IN ('fcb-1', 'fcb-2', 'fcb-3', 'fcb-4', 'fcb-5', 'fcb-6', 'fcb-7', 'fcb-8', 'fcb-9', 'fcb-10', 'fcb-11');

-- Napoli 1987
UPDATE Players SET TeamId = 'napoli-1987' WHERE Id IN ('nap-1', 'nap-2', 'nap-3', 'nap-4', 'nap-5', 'nap-6', 'nap-7', 'nap-8', 'nap-9', 'nap-10', 'nap-11');

-- AC Milan 1993
UPDATE Players SET TeamId = 'ac-milan-1993' WHERE Id IN ('acm-1', 'acm-2', 'acm-3', 'acm-4', 'acm-5', 'acm-6', 'acm-7', 'acm-8', 'acm-9', 'acm-10', 'acm-11');

-- Real Madrid 2014
UPDATE Players SET TeamId = 'real-madrid-2014' WHERE Id IN ('rm-1', 'rm-2', 'rm-3', 'rm-4', 'rm-5', 'rm-6', 'rm-7', 'rm-8', 'rm-9', 'rm-10', 'rm-11');

-- Red Star Belgrade 1991
UPDATE Players SET TeamId = 'red-star-belgrade-1991' WHERE Id IN ('rsb-1', 'rsb-2', 'rsb-3', 'rsb-4', 'rsb-5', 'rsb-6', 'rsb-7', 'rsb-8', 'rsb-9', 'rsb-10', 'rsb-11');

-- Ajax 1973
UPDATE Players SET TeamId = 'ajax-1973' WHERE Id IN ('ajax-1', 'ajax-2', 'ajax-3', 'ajax-4', 'ajax-5', 'ajax-6', 'ajax-7', 'ajax-8', 'ajax-9', 'ajax-10', 'ajax-11');

-- Arsenal 2004
UPDATE Players SET TeamId = 'arsenal-2004' WHERE Id IN ('ars-1', 'ars-2', 'ars-3', 'ars-4', 'ars-5', 'ars-6', 'ars-7', 'ars-8', 'ars-9', 'ars-10', 'ars-11');

-- France 2000
UPDATE Players SET TeamId = 'france-2000' WHERE Id IN ('fra-1', 'fra-2', 'fra-3', 'fra-4', 'fra-5', 'fra-6', 'fra-7', 'fra-8', 'fra-9', 'fra-10', 'fra-11');

-- Argentina 1986
UPDATE Players SET TeamId = 'argentina-1986' WHERE Id IN ('arg-1', 'arg-2', 'arg-3', 'arg-4', 'arg-5', 'arg-6', 'arg-7', 'arg-8', 'arg-9', 'arg-10', 'arg-11');

-- Germany 1990
UPDATE Players SET TeamId = 'germany-1990' WHERE Id IN ('ger-1', 'ger-2', 'ger-3', 'ger-4', 'ger-5', 'ger-6', 'ger-7', 'ger-8', 'ger-9', 'ger-10', 'ger-11');

-- Spain 2012
UPDATE Players SET TeamId = 'spain-2012' WHERE Id IN ('spa-1', 'spa-2', 'spa-3', 'spa-4', 'spa-5', 'spa-6', 'spa-7', 'spa-8', 'spa-9', 'spa-10', 'spa-11');

-- Hungary 1954
UPDATE Players SET TeamId = 'hungary-1954' WHERE Id IN ('hun-1', 'hun-2', 'hun-3', 'hun-4', 'hun-5', 'hun-6', 'hun-7', 'hun-8', 'hun-9', 'hun-10', 'hun-11');

-- Verify the updates worked
SELECT TeamId, COUNT(*) as PlayerCount FROM Players WHERE TeamId IS NOT NULL GROUP BY TeamId ORDER BY TeamId;
