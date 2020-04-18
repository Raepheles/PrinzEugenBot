export function getTimeFromMs(ms: number | null, includeMs?: boolean): string {
  if(!ms) return '00:00:00';
  let seconds = Math.floor(ms / 1000);
  const millis = ms - seconds * 1000;
  let minutes = Math.floor(seconds / 60);
  seconds -= minutes * 60;
  let hours = Math.floor(minutes / 60);
  minutes -= hours * 60;
  const days = Math.floor(hours / 24);
  hours -= days * 24;

  const hh = hours > 9 ? `${hours}` : `0${hours}`;
  const mm = minutes > 9 ? `${minutes}` : `0${minutes}`;
  const ss = seconds > 9 ? `${seconds}` : `0${seconds}`;
  let _ms;
  if(millis > 99) {
    _ms = `${millis}`;
  } else if(millis > 9) {
    _ms = `0${millis}`;
  } else {
    _ms = `00${millis}`;
  }

  let res;
  if(days) {
    res = `${days} days, ${hh} hours, ${mm} mins, ${ss} secs`;
  } else if(hours) {
    res = `${hh} hours, ${mm} mins, ${ss} secs`;
  } else if(minutes) {
    res = `${mm} mins, ${ss} secs`;
  } else {
    res = `${ss} secs`;
  }

  if(includeMs) {
    if(seconds) return `${res} ${_ms} ms`;
    else return `${_ms} ms`;
  } else {
    return res;
  }
}