fetch('https://the-scorched-society.onrender.com/members')
  .then(res => res.json())
  .then(data => {
    const container = document.querySelector('.leader-list');
    container.innerHTML = '';

    data.forEach(member => {
      const div = document.createElement('div');
      div.className = 'leader';
      div.style.display = 'flex';
      div.style.alignItems = 'center';
      div.style.gap = '10px';
      div.style.marginBottom = '10px';

      div.innerHTML = `
        <img src="${member.avatar}" alt="avatar" width="40" height="40" style="border-radius:50%">
        <div>
          <div style="font-weight:700">${member.displayName}</div>
          <div style="color:var(--muted);font-size:13px">${member.role}</div>
        </div>
      `;

      container.appendChild(div);
    });
  })
  .catch(err => {
    console.error('Failed to load members:', err);
  });
