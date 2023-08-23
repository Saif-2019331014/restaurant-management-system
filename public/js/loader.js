function loader(){
    document.querySelector('.loader').style.display = 'none';
 }
 
 function fadeOut(){
    setInterval(loader, 1000);
 }
 
 window.onload = fadeOut;