// Configuration
const totalTime = 10000; // 10 seconds in milliseconds
const redirectUrl = "Game.html"; 

// Elements
const percentageText = document.getElementById('percentage');
const progressLine = document.querySelector('.progress-line');

let startTime = null;

function animateLoading(timestamp) {
    if (!startTime) startTime = timestamp;
    
    // Calculate progress
    const elapsed = timestamp - startTime;
    let progress = Math.min((elapsed / totalTime) * 100, 100);
    
    // Update visual elements
    percentageText.innerText = Math.floor(progress) + "%";
    progressLine.style.width = progress + "%";
    
    // Check if finished
    if (elapsed < totalTime) {
        requestAnimationFrame(animateLoading);
    } else {
        // Finished: Redirect
        window.location.href = redirectUrl;
    }
}

// Start the animation
requestAnimationFrame(animateLoading);
```[[1](https://www.google.com/url?sa=E&q=https%3A%2F%2Fvertexaisearch.cloud.google.com%2Fgrounding-api-redirect%2FAUZIYQFE3lVWUAZz879uSoXxtufpsKBohzBCAJrWJOnOysda5eYBUSS6QEJv6QPigddAlWUrlQ3XQyU6PY9S1WVQKwgEdb9HMeSme9gHYWgcbtoE94U35RrrwZwLvBIeeqvHGQeNhNUX8qyz4ZDtJQw%3D)]
