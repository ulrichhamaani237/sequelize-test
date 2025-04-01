
function formatDateISO(date) {
    const d = new Date(date);
    return d.toISOString().split('T')[0].replace(/-/g, '');
}

module.exports = {formatDateISO};