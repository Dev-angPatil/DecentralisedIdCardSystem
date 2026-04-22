import { getState } from "./main.js";

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIMES = ['9:00 AM', '11:00 AM', '2:00 PM', '4:00 PM'];

function renderTimetable() {
  const target = document.querySelector('[data-timetable]');
  if (!target) return;

  const state = getState();
  const enrolledIds = state.enrolledCourses || [];
  const allCourses = state.courses || [];
  
  const enrolledCourses = allCourses.filter(c => enrolledIds.includes(c.id));

  let html = `<div class="tt-header">Time</div>`;
  DAYS.forEach(day => {
    html += `<div class="tt-header">${day}</div>`;
  });

  TIMES.forEach(time => {
    html += `<div class="tt-time">${time}</div>`;
    DAYS.forEach(day => {
      const course = enrolledCourses.find(c => c.days.includes(day) && c.time === time);
      if (course) {
        html += `
          <div class="tt-slot" style="background:var(--pastel-${course.color}); border-color:var(--pastel-${course.color}-border)">
            <span class="tt-course-code" style="color:var(--text)">${course.code}</span>
            <span class="tt-room">${course.room}</span>
          </div>`;
      } else {
        html += `<div class="tt-slot empty"></div>`;
      }
    });
  });

  target.innerHTML = html;
}

renderTimetable();
