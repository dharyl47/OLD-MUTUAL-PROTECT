import React, { useState } from 'react';

const Calendar = () => {
  const [selectedYear, setSelectedYear] = useState(1994);
  const [selectedMonth, setSelectedMonth] = useState(2); // 0 - January, 2 - March
  const [selectedDate, setSelectedDate] = useState(22);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);

  const handleYearChange = (e) => {
    setSelectedYear(parseInt(e.target.value));
  };

  const handleMonthClick = (index) => {
    setSelectedMonth(index);
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
  };

  return (
    <>
      <div style={{ backgroundColor: '#333', color: '#fff', padding: '20px', borderRadius: '4px', width: '400px' }}>
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <select 
            value={selectedYear} 
            onChange={handleYearChange}
            style={{ backgroundColor: '#333', color: '#fff', border: 'none', padding: '5px', borderRadius: '4px', fontSize: '16px', textAlign: 'center' }}
          >
            {Array.from({ length: 100 }, (_, i) => (
              <option key={i} value={1994 + i}>{1994 + i}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', textAlign: 'center' }}>
          {months.map((month, index) => (
            <div 
              key={index} 
              onClick={() => handleMonthClick(index)}
              style={{ 
                cursor: 'pointer',
                color: selectedMonth === index ? '#88c550' : '#fff',
                fontWeight: selectedMonth === index ? 'bold' : 'normal',
                fontSize: '16px',
              }}
            >
              {month}
            </div>
          ))}
        </div>
      </div>

      <br/>

      <div style={{ backgroundColor: '#333', color: '#fff', padding: '20px', borderRadius: '4px', width: '400px', marginLeft: '-1px' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{months[selectedMonth]} {selectedYear}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '15px', textAlign: 'center' }}>
          {Array.from({ length: daysInMonth }, (_, i) => (
            <div 
              key={i} 
              onClick={() => handleDateClick(i + 1)}
              style={{
                cursor: 'pointer',
                color: selectedDate === i + 1 ? '#88c550' : '#fff',
                fontWeight: selectedDate === i + 1 ? 'bold' : 'normal',
                fontSize: '16px',
              }}
            >
              {String(i + 1).padStart(2, '0')}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Calendar;
