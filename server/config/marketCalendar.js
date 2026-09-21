/**
 * MarketCalendarProvider
 * Handles Indian market hours (09:15 - 15:30 IST), holidays, special trading sessions,
 * and exposes calendar metadata (year, source, lastUpdated).
 */

export const CALENDAR_METADATA = {
  calendarYear: 2026,
  calendarSource: 'NSE/BSE Official Holiday Schedule & Circulars',
  lastUpdated: '2026-09-08',
};

// Verified Indian Market Holidays for 2026 (YYYY-MM-DD)
export const TRADING_HOLIDAYS_2026 = {
  '2026-01-26': 'Republic Day',
  '2026-02-17': 'Mahashivratri',
  '2026-03-04': 'Holi',
  '2026-03-20': 'Id-Ul-Fitr (Ramadan Eid)',
  '2026-04-03': 'Good Friday',
  '2026-04-14': 'Dr. Baba Saheb Ambedkar Jayanti',
  '2026-05-01': 'Maharashtra Day',
  '2026-05-27': 'Bakri Id / Eid-Ul-Adha',
  '2026-06-26': 'Muharram',
  '2026-08-15': 'Independence Day',
  '2026-09-04': 'Milad-un-Nabi',
  '2026-10-02': 'Mahatma Gandhi Jayanti',
  '2026-10-20': 'Dussehra',
  '2026-11-08': 'Diwali Laxmi Pujan (Special Muhurat Trading Session evening)',
  '2026-11-10': 'Diwali Balipratipada',
  '2026-11-24': 'Gurunanak Jayanti',
  '2026-12-25': 'Christmas',
};

// Special / Muhurat Trading Sessions
export const SPECIAL_SESSIONS = {
  '2026-11-08': {
    name: 'Diwali Muhurat Trading',
    openTime: '18:15',
    closeTime: '19:15',
  },
};

/**
 * Get current Indian Standard Time (IST) components
 */
export function getISTDate(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const map = {};
  for (const p of parts) {
    map[p.type] = p.value;
  }

  const year = parseInt(map.year, 10);
  const month = parseInt(map.month, 10);
  const day = parseInt(map.day, 10);
  const hour = parseInt(map.hour, 10);
  const minute = parseInt(map.minute, 10);
  const second = parseInt(map.second, 10);

  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const timeMinutes = hour * 60 + minute;
  const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;

  // Calculate day of week in IST
  const istDateObj = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  const dayOfWeek = istDateObj.getUTCDay(); // 0 = Sun, 6 = Sat

  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
    dateStr,
    timeMinutes,
    timeStr,
    dayOfWeek,
    istFormatted: `${dateStr} ${timeStr} IST`,
  };
}

/**
 * Evaluate current Indian Market Session Status
 */
export function getMarketStatus(date = new Date()) {
  const ist = getISTDate(date);
  const holidayName = TRADING_HOLIDAYS_2026[ist.dateStr];
  const specialSession = SPECIAL_SESSIONS[ist.dateStr];

  // 1. Weekend Check (0 = Sun, 6 = Sat)
  if (ist.dayOfWeek === 0 || ist.dayOfWeek === 6) {
    return {
      isOpen: false,
      session: 'WEEKEND',
      message: 'Market Closed (Weekend)',
      istTime: ist.istFormatted,
      calendar: CALENDAR_METADATA,
    };
  }

  // 2. Special Session (e.g. Muhurat Trading)
  if (specialSession) {
    const [openH, openM] = specialSession.openTime.split(':').map(Number);
    const [closeH, closeM] = specialSession.closeTime.split(':').map(Number);
    const openMin = openH * 60 + openM;
    const closeMin = closeH * 60 + closeM;

    if (ist.timeMinutes >= openMin && ist.timeMinutes < closeMin) {
      return {
        isOpen: true,
        session: 'SPECIAL',
        message: `Market Open (${specialSession.name})`,
        istTime: ist.istFormatted,
        calendar: CALENDAR_METADATA,
      };
    }
    return {
      isOpen: false,
      session: 'SPECIAL_CLOSED',
      message: `Market Closed (${specialSession.name} from ${specialSession.openTime} to ${specialSession.closeTime} IST)`,
      istTime: ist.istFormatted,
      calendar: CALENDAR_METADATA,
    };
  }

  // 3. Holiday Check
  if (holidayName) {
    return {
      isOpen: false,
      session: 'HOLIDAY',
      message: `Market Closed (${holidayName})`,
      istTime: ist.istFormatted,
      calendar: CALENDAR_METADATA,
    };
  }

  // 4. Regular Trading Hours:
  // Pre-open: 09:00 - 09:08 (540 to 548)
  // Regular Trading: 09:15 - 15:30 (555 to 930)
  // Post-close: 15:40 - 16:00 (940 to 960)
  const PRE_OPEN = 9 * 60; // 09:00
  const MARKET_OPEN = 9 * 60 + 15; // 09:15
  const MARKET_CLOSE = 15 * 60 + 30; // 15:30
  const POST_CLOSE_END = 16 * 60; // 16:00

  if (ist.timeMinutes >= MARKET_OPEN && ist.timeMinutes < MARKET_CLOSE) {
    return {
      isOpen: true,
      session: 'NORMAL',
      message: 'Market Open (Normal Session: 09:15 - 15:30 IST)',
      istTime: ist.istFormatted,
      calendar: CALENDAR_METADATA,
    };
  }

  if (ist.timeMinutes >= PRE_OPEN && ist.timeMinutes < MARKET_OPEN) {
    return {
      isOpen: false,
      session: 'PRE_OPEN',
      message: 'Pre-Market Session (09:00 - 09:15 IST)',
      istTime: ist.istFormatted,
      calendar: CALENDAR_METADATA,
    };
  }

  if (ist.timeMinutes >= MARKET_CLOSE && ist.timeMinutes < POST_CLOSE_END) {
    return {
      isOpen: false,
      session: 'POST_CLOSE',
      message: 'Post-Market Session (15:30 - 16:00 IST)',
      istTime: ist.istFormatted,
      calendar: CALENDAR_METADATA,
    };
  }

  return {
    isOpen: false,
    session: 'CLOSED',
    message: 'Market Closed (Normal Hours: 09:15 - 15:30 IST)',
    istTime: ist.istFormatted,
    calendar: CALENDAR_METADATA,
  };
}
