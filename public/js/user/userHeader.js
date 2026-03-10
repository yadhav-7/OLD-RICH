document.addEventListener("DOMContentLoaded", () => {


    setInterval(() => {
        fetch('/check-user-block', {
            method: 'GET',
            credentials: 'include'
        })
            .then(res => {

               
                if (!res.ok) {

                    window.location.href = '/login'
                }


                return res.json()
            })
            .then(data => {
                if (data?.result?.isBlock === true) {
                    window.location.href = '/login'
                }

            })
            .catch((err) => {
                
                window.location.href = '/login'
            })
    }, 3000)


    const currentPath = window.location.pathname.toLowerCase();

    
    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.remove("active")
    });

  
    document.querySelectorAll(".nav-link").forEach(link => {
        const linkPath = link.getAttribute("href");

        
        if (linkPath === "/" && currentPath === "/") {
            link.classList.add("active");
        }
      
        else if (linkPath !== "/" && currentPath === linkPath.toLowerCase()) {
            link.classList.add("active");
        }
    })
})
