// The four things a request can be. Written once here, so a typo like 'wating' can't sneak in anywhere
const STATUS = {
    WAITING: 'waiting',     // Sam asked, and I haven't answered yet
    APPROVED: 'approved',   // I said yes, and Dune was lent to Sam
    DECLINED: 'declined',   // I said no, maybe with a note
    CANCELLED: 'cancelled', // Sam took it back before I answered
};

module.exports = STATUS;
