/* =========================================================
   BACKGROUND MUSIC
========================================================= */

const music = document.getElementById("bgMusic");
const musicBtn = document.getElementById("musicBtn");
const musicText = document.getElementById("musicText");

let isPlaying = false;

musicBtn.addEventListener("click", async () => {

    try {

        if (!isPlaying) {

            await music.play();

            isPlaying = true;

            musicText.textContent = "Pause";

            musicBtn.classList.add("playing");

        } else {

            music.pause();

            isPlaying = false;

            musicText.textContent = "Tap for music";

            musicBtn.classList.remove("playing");
        }

    } catch (error) {

        console.error(
            "Music could not be played:",
            error
        );

    }

});


/* =========================================================
   GUEST MESSAGE
========================================================= */

const guestName =
    document.getElementById("guestName");

const revealBtn =
    document.getElementById("revealBtn");

const guestMessage =
    document.getElementById("guestMessage");

let guests = [];


/* =========================================================
   LOAD GUESTS
========================================================= */

async function loadGuests() {

    try {

        const response =
            await fetch("./guests.json");

        if (!response.ok) {

            throw new Error(
                "Could not load guests.json"
            );

        }

        guests =
            await response.json();

        console.log(
            "Guest list loaded:",
            guests
        );

    } catch (error) {

        console.error(
            "Error loading guests.json:",
            error
        );

    }

}


/* =========================================================
   NORMALIZE NAME
========================================================= */

function normalizeName(name) {

    return name
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase();

}


/* =========================================================
   FIND GUESTS
========================================================= */

function findGuests(searchName) {

    const search =
        normalizeName(searchName);

    return guests.filter(guest => {

        const fullName =
            normalizeName(guest.name);

        if (fullName === search) {

            return true;

        }

        const firstName =
            fullName.split(" ")[0];

        return firstName === search;

    });

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;

}


/* =========================================================
   SHOW GUEST MESSAGE
========================================================= */

function showGuestMessage(guest) {

    guestMessage.innerHTML = `

        <div class="message-divider"></div>

        <p class="message-text">

            Dear
            <strong>
                ${escapeHTML(guest.name)}
            </strong>,

            <br><br>

            ${escapeHTML(guest.message)}

        </p>

    `;

    guestMessage.classList.add("show");

}


/* =========================================================
   SHOW GUEST CHOICES
========================================================= */

function showGuestChoices(matches) {

    let buttons = "";

    matches.forEach((guest, index) => {

        buttons += `

            <button
                class="guest-choice"
                data-index="${index}"
                type="button">

                ${escapeHTML(guest.name)}

            </button>

        `;

    });


    guestMessage.innerHTML = `

        <div class="message-divider"></div>

        <p class="message-text">

            We found a few guests with that name.

            <br>

            Please select your name.

        </p>

        <div class="guest-choices">

            ${buttons}

        </div>

    `;


    guestMessage.classList.add("show");


    const choiceButtons =
        guestMessage.querySelectorAll(
            ".guest-choice"
        );


    choiceButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const index =
                    button.dataset.index;

                const selectedGuest =
                    matches[index];

                showGuestMessage(
                    selectedGuest
                );

            }
        );

    });

}


/* =========================================================
   REVEAL GUEST MESSAGE
========================================================= */

function revealGuestMessage() {

    const input =
        guestName.value.trim();


    /* =====================================================
       EMPTY NAME
    ===================================================== */

    if (!input) {

        guestName.focus();


        guestMessage.innerHTML = `

            <div class="message-divider"></div>

            <p class="message-text validation-message">

                Please enter your name first.

            </p>

        `;


        guestMessage.classList.add(
            "show"
        );


        /*
         * Restart the red shake animation.
         */

        guestName.classList.remove(
            "name-required"
        );

        void guestName.offsetWidth;

        guestName.classList.add(
            "name-required"
        );

        return;
    }


    /* =====================================================
       NAME ENTERED
    ===================================================== */

    guestName.classList.remove(
        "name-required"
    );


    const matches =
        findGuests(input);


    /* =====================================================
       NAME NOT FOUND
    ===================================================== */

    if (matches.length === 0) {

        guestMessage.innerHTML = `

            <div class="message-divider"></div>

            <p class="message-text">

                We couldn't find your name
                on our guest list.

                <br><br>

                Please try typing your first
                name or full name.

            </p>

        `;


        guestMessage.classList.add(
            "show"
        );

        return;
    }


    /* =====================================================
       ONE MATCH
    ===================================================== */

    if (matches.length === 1) {

        showGuestMessage(
            matches[0]
        );

        return;
    }


    /* =====================================================
       MULTIPLE MATCHES
    ===================================================== */

    showGuestChoices(
        matches
    );

}


/* =========================================================
   ENTER KEY
========================================================= */

guestName.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {

            revealGuestMessage();

        }

    }
);


/* =========================================================
   REVEAL BUTTON
========================================================= */

revealBtn.addEventListener(
    "click",
    revealGuestMessage
);


/* =========================================================
   NAME INPUT INTERACTION
========================================================= */

guestName.addEventListener(
    "input",
    () => {

        const hasName =
            guestName.value.trim().length > 0;


        if (hasName) {

            guestName.classList.remove(
                "name-required"
            );

            guestMessage.classList.remove(
                "show"
            );

            revealBtn.classList.add(
                "ready"
            );

        } else {

            revealBtn.classList.remove(
                "ready"
            );

        }

    }
);


loadGuests();


/* =========================================================
   BACKGROUND SCROLL EFFECT
========================================================= */

const bgVideo =
    document.querySelector(".bg-video");

const colorBackground =
    document.querySelector(
        ".color-background"
    );

let currentScroll = 0;
let targetScroll = 0;


function updateBackgroundScroll() {

    targetScroll =
        window.scrollY;


    if (window.scrollY > 35) {

        document.body.classList.add(
            "has-scrolled"
        );

    } else {

        document.body.classList.remove(
            "has-scrolled"
        );

    }

}


function animateBackground() {

    currentScroll +=
        (targetScroll - currentScroll) *
        0.055;


    const maxScroll =
        Math.max(
            document.documentElement.scrollHeight -
            window.innerHeight,
            1
        );


    const scrollProgress =
        Math.min(
            Math.max(
                currentScroll / maxScroll,
                0
            ),
            1
        );


    /* =====================================================
       VIDEO FADE
    ===================================================== */

    const fadeStart = 0.015;
    const fadeEnd = 0.24;


    let videoProgress =
        (scrollProgress - fadeStart) /
        (fadeEnd - fadeStart);


    videoProgress =
        Math.min(
            Math.max(
                videoProgress,
                0
            ),
            1
        );


    const smoothFade =
        videoProgress *
        videoProgress *
        (3 - 2 * videoProgress);


    bgVideo.style.opacity =
        1 - smoothFade;


    /* =====================================================
       SUBTLE BACKGROUND MOVEMENT
    ===================================================== */

    const moveX =
        Math.sin(
            scrollProgress *
            Math.PI *
            1.15
        ) * 4;


    const moveY =
        Math.cos(
            scrollProgress *
            Math.PI *
            0.95
        ) * 3;


    colorBackground.style.transform =
        `translate3d(
            ${moveX}px,
            ${moveY}px,
            0
        ) scale(1.08)`;


    const positionX =
        42 +
        Math.sin(
            scrollProgress *
            Math.PI *
            1.15
        ) * 13;


    const positionY =
        45 +
        Math.cos(
            scrollProgress *
            Math.PI *
            0.95
        ) * 9;


    colorBackground.style.backgroundPosition =
        `${positionX}% ${positionY}%`;


    requestAnimationFrame(
        animateBackground
    );

}


window.addEventListener(
    "scroll",
    updateBackgroundScroll,
    {
        passive: true
    }
);


updateBackgroundScroll();

animateBackground();


/* =========================================================
   CINEMATIC HERO SEQUENCE
   TIMINGS PRESERVED
========================================================= */

(function startCinematicHero() {

    const eyebrow =
        document.querySelector(
            ".eyebrow-reveal"
        );

    const line =
        document.querySelector(
            ".line-reveal"
        );

    const intro =
        document.querySelector(
            ".intro-reveal"
        );

    const name =
        document.querySelector(
            ".cinematic-name"
        );

    const underline =
        document.querySelector(
            ".underline-reveal"
        );

    const label =
        document.querySelector(
            ".label-reveal"
        );

    const title =
        document.querySelector(
            ".cinematic-title"
        );

    const hosted =
        document.querySelector(
            ".hosted-reveal"
        );

    const scrollIndicator =
        document.querySelector(
            ".scroll-reveal"
        );


    let started = false;


    function reveal(element) {

        if (element) {

            element.classList.add(
                "show"
            );

        }

    }


    function startSequence() {

        if (started) {

            return;

        }


        started = true;


        /* =================================================
           EXISTING TIMINGS — PRESERVED
        ================================================= */


        setTimeout(() => {

            reveal(eyebrow);
            reveal(line);

        }, 500);


        setTimeout(() => {

            reveal(intro);

        }, 600);


        setTimeout(() => {

            reveal(name);
            reveal(underline);

        }, 1500);


        setTimeout(() => {

            reveal(label);

        }, 3000);


        setTimeout(() => {

            reveal(title);

        }, 4200);


        setTimeout(() => {

            reveal(hosted);

        }, 7000);


        setTimeout(() => {

            reveal(scrollIndicator);


            if (scrollIndicator) {

                scrollIndicator.classList.add(
                    "scroll-ready"
                );

            }

        }, 7000);


        /* =================================================
           AUTOMATIC SMOOTH SCROLL
        ================================================= */

        setTimeout(() => {

            if (window.scrollY <= 10) {

                const eventDetails =
                    document.querySelector(
                        ".event-details"
                    );


                if (!eventDetails) {

                    return;

                }


                const sectionTop =
                    eventDetails.getBoundingClientRect().top +
                    window.scrollY;


                const viewportHeight =
                    window.innerHeight;


                let targetPosition =
                    sectionTop -
                    (viewportHeight * 0.52);


                const maxScroll =
                    document.documentElement.scrollHeight -
                    window.innerHeight;


                targetPosition =
                    Math.max(
                        0,
                        Math.min(
                            targetPosition,
                            maxScroll
                        )
                    );


                smoothScrollTo(
                    targetPosition,
                    2400
                );


                /* =================================================
                   INPUT PULSE
                   
                   The automatic scroll finishes after
                   approximately 2400ms.

                   Then the guest input gets a visible
                   gold pulse so the user notices it.
                ================================================= */

                setTimeout(() => {

                    const nameInput =
                        document.getElementById(
                            "guestName"
                        );


                    if (!nameInput) {

                        return;

                    }


                    nameInput.classList.remove(
                        "input-pulse"
                    );


                    void nameInput.offsetWidth;


                    nameInput.classList.add(
                        "input-pulse"
                    );


                }, 2600);

            }

        }, 7000);

    }


    /* =====================================================
       ULTRA-SMOOTH SCROLL
    ===================================================== */

    function smoothScrollTo(
        target,
        duration
    ) {

        const start =
            window.scrollY;


        const distance =
            target - start;


        const startTime =
            performance.now();


        function easeInOutCubic(t) {

            return t < 0.5

                ? 4 * t * t * t

                : 1 -
                    Math.pow(
                        -2 * t + 2,
                        3
                    ) / 2;

        }


        function animateScroll(
            currentTime
        ) {

            const elapsed =
                currentTime -
                startTime;


            const progress =
                Math.min(
                    elapsed / duration,
                    1
                );


            const eased =
                easeInOutCubic(
                    progress
                );


            window.scrollTo(
                0,
                start +
                distance * eased
            );


            if (progress < 1) {

                requestAnimationFrame(
                    animateScroll
                );

            }

        }


        requestAnimationFrame(
            animateScroll
        );

    }


    /* =====================================================
       START WHEN VIDEO PLAYS
    ===================================================== */

    const video =
        document.querySelector(
            ".bg-video"
        );


    if (video) {

        video.addEventListener(
            "play",
            startSequence,
            {
                once: true
            }
        );


        if (!video.paused) {

            startSequence();

        }

    } else {

        startSequence();

    }

})();