const DEFAULT_SEARCH_LENGTH = 6;

function normalizeSearchLength(searchLength, totalCount) {
    const configuredCount = Number(searchLength);
    const count = Number.isFinite(configuredCount)
        ? Math.max(Math.floor(configuredCount), 0)
        : DEFAULT_SEARCH_LENGTH;
    return Math.min(count, totalCount);
}

function splitQuerySource(querySource, searchLength) {
    const visibleCount = normalizeSearchLength(searchLength, querySource.length);
    return {
        visible: querySource.slice(0, visibleCount),
        more: querySource.slice(visibleCount),
    };
}

module.exports = {
    normalizeSearchLength,
    splitQuerySource,
};
