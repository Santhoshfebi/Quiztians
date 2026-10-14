/* ==========================================================
   RESULTS HELPERS
========================================================== */

/* ==========================================================
   NORMALIZE TEXT

   Useful for phone numbers, search values and comparisons.
========================================================== */

export function normalizeText(value) {
    return String(value ?? "").trim();
}

/* ==========================================================
   SORT UNIQUE VALUES

   Used for:
   - Chapters
   - Languages
   - Places
========================================================== */

export function getUniqueOptions(rows, field) {
    return [
        ...new Set(
            rows
                .map((row) => row?.[field])
                .filter(Boolean)
        ),
    ].sort((a, b) =>
        String(a).localeCompare(String(b))
    );
}

/* ==========================================================
   FILTER RESULTS
========================================================== */

export function filterResults(
    allRows,
    {
        search = "",
        chapterFilter = [],
        languageFilter = "",
        placeFilter = "",
        showHighestScore = false,
    } = {}
) {
    let rows = [...allRows];

    /* --------------------------------------------------------
       SEARCH
    -------------------------------------------------------- */

    const query = normalizeText(search).toLowerCase();

    if (query) {
        rows = rows.filter((row) => {
            const searchableValues = [
                row.name,
                row.phone,
                row.chapter,
                row.language,
                row.place,
            ];

            return searchableValues.some((value) =>
                String(value ?? "")
                    .toLowerCase()
                    .includes(query)
            );
        });
    }

    /* --------------------------------------------------------
       CHAPTER
    -------------------------------------------------------- */

    if (chapterFilter.length > 0) {
        rows = rows.filter((row) =>
            chapterFilter.includes(row.chapter)
        );
    }

    /* --------------------------------------------------------
       LANGUAGE
    -------------------------------------------------------- */

    if (languageFilter) {
        rows = rows.filter(
            (row) => row.language === languageFilter
        );
    }

    /* --------------------------------------------------------
       PLACE
    -------------------------------------------------------- */

    if (placeFilter) {
        rows = rows.filter(
            (row) => row.place === placeFilter
        );
    }

    /* --------------------------------------------------------
       HIGHEST SCORE
  
       Keep one best result for each:
       phone + chapter
  
       IMPORTANT:
       We use > rather than >=.
  
       allRows comes from Supabase newest-first, so when two
       attempts have the same score, the newer attempt remains.
    -------------------------------------------------------- */

    if (showHighestScore) {
        rows = getHighestScoreRows(rows);
    }

    return rows;
}

/* ==========================================================
   HIGHEST SCORE PER PHONE + CHAPTER
========================================================== */

export function getHighestScoreRows(rows) {
    const bestResults = new Map();

    rows.forEach((row) => {
        const phone = normalizeText(row.phone);
        const chapter = normalizeText(row.chapter);

        /*
         * JSON.stringify avoids accidental collisions that can
         * happen with keys such as `${phone}-${chapter}`.
         */
        const key = JSON.stringify([
            phone,
            chapter,
        ]);

        const existing = bestResults.get(key);

        if (!existing) {
            bestResults.set(key, row);
            return;
        }

        const currentScore = Number(row.score || 0);
        const existingScore = Number(existing.score || 0);

        if (currentScore > existingScore) {
            bestResults.set(key, row);
        }
    });

    return Array.from(bestResults.values());
}

/* ==========================================================
   DUPLICATE PHONE NUMBERS

   This intentionally runs AFTER the normal filters.

   A phone number is considered duplicate when it appears
   more than once in the currently filtered result set.
========================================================== */

export function getDuplicatePhones(rows) {
    const counts = new Map();

    rows.forEach((row) => {
        const phone = normalizeText(row.phone);

        if (!phone) {
            return;
        }

        counts.set(
            phone,
            (counts.get(phone) || 0) + 1
        );
    });

    return new Set(
        Array.from(counts.entries())
            .filter(([, count]) => count > 1)
            .map(([phone]) => phone)
    );
}

/* ==========================================================
   DISPLAY ROWS

   "Show Duplicates" only changes what is displayed.

   It does NOT change filteredRows. This preserves the
   existing CSV export behavior.
========================================================== */

export function getDisplayRows(
    filteredRows,
    duplicatePhones,
    showDuplicates
) {
    if (!showDuplicates) {
        return filteredRows;
    }

    return filteredRows.filter((row) => {
        const phone = normalizeText(row.phone);

        return duplicatePhones.has(phone);
    });
}

/* ==========================================================
   CSV ESCAPE
========================================================== */

export function escapeCSVValue(value) {
    if (value === null || value === undefined) {
        return "";
    }

    let normalizedValue = value;

    if (typeof normalizedValue === "object") {
        normalizedValue = JSON.stringify(
            normalizedValue
        );
    }

    const text = String(normalizedValue).replace(
        /"/g,
        '""'
    );

    return `"${text}"`;
}

/* ==========================================================
   CREATE RESULTS CSV

   We use the keys from the first result exactly as before,
   so the exported columns continue matching the Supabase
   result object.
========================================================== */

export function createResultsCSV(rows) {
    if (!rows.length) {
        return "";
    }

    const headers = Object.keys(rows[0]);

    const headerRow = headers
        .map(escapeCSVValue)
        .join(",");

    const dataRows = rows.map((row) =>
        headers
            .map((header) =>
                escapeCSVValue(row[header])
            )
            .join(",")
    );

    return [
        headerRow,
        ...dataRows,
    ].join("\n");
}

/* ==========================================================
   CSV FILE NAME
========================================================== */

export function getResultsCSVFilename() {
    const dateStamp = new Date()
        .toISOString()
        .slice(0, 10);

    return `quiztians-results-${dateStamp}.csv`;
}