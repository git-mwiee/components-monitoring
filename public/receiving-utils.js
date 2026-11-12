function receivedDateTimestamp(value) {
    const text = String(value ?? '').trim();
    if (!text) return null;

    const isoDate = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    const numericDate = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
    const namedDate = text.match(/^(\d{1,2})[-\s]([A-Za-z]{3,})[-\s](\d{2,4})$/);
    let year, month, day;

    if (isoDate) {
        [, year, month, day] = isoDate;
    } else if (numericDate) {
        [, day, month, year] = numericDate;
    } else if (namedDate) {
        const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        [, day, month] = namedDate;
        month = months.indexOf(month.slice(0, 3).toLowerCase()) + 1;
        year = namedDate[3];
        if (!month) return null;
    } else if (/^\d{5}(\.\d+)?$/.test(text) && Number(text) >= 1 && Number(text) <= 100000) {
        return Date.UTC(1899, 11, 30) + Number(text) * 86400000;
    } else {
        const timestamp = Date.parse(text);
        return Number.isNaN(timestamp) ? null : timestamp;
    }

    year = Number(year);
    if (year < 100) year += year < 70 ? 2000 : 1900;
    month = Number(month);
    day = Number(day);
    const timestamp = Date.UTC(year, month - 1, day);
    const parsed = new Date(timestamp);
    return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day
        ? timestamp
        : null;
}

export function sortReceivedNewestFirst(rows) {
    return rows
        .map((row, index) => ({ row, index, timestamp: receivedDateTimestamp(row.date) }))
        .sort((a, b) => {
            if (a.timestamp === null) return b.timestamp === null ? a.index - b.index : 1;
            if (b.timestamp === null) return -1;
            return b.timestamp - a.timestamp || a.index - b.index;
        })
        .map(item => item.row);
}
