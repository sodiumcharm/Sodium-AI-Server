const formatLocalDate = function (date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  };

  const formatted = date.toLocaleString('en-US', options);

  const parts = formatted.split(' ');
  const time = parts[0] + ' ' + parts[1]; // "02:15 PM"
  const month = parts[2]; // "July"
  const day = parts[3].replace(',', ''); // "4"
  const year = parts[4]; // "2025"

  return `${time} ${day} ${month}, ${year}`;
};

export default formatLocalDate;
