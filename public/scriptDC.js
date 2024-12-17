// Interactive hover effect on profile picture
document.addEventListener('DOMContentLoaded', () => {
    const profilePic = document.querySelector('.profile-pic');
    
    profilePic.addEventListener('mouseover', () => {
      profilePic.style.transform = 'scale(1.1)';
      profilePic.style.transition = 'transform 0.3s ease';
    });
  
    profilePic.addEventListener('mouseout', () => {
      profilePic.style.transform = 'scale(1)';
    });
  });
  