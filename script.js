/* =========================================================
   GLOBAL INVITATION STATE
========================================================= */

let invitationStarted = false;


/* =========================================================
   ELEMENTS
========================================================= */

const loadingScreen =
    document.getElementById("loadingScreen");

const loadingStatus =
    document.getElementById("loadingStatus");

const loadingProgress =
    document.getElementById("loadingProgress");

const viewInvitationWrapper =
    document.getElementById("viewInvitationWrapper");

const viewInvitationBtn =
    document.getElementById("viewInvitationBtn");

const bgVideo =
    document.getElementById("bgVideo");

const music =
    document.getElementById("bgMusic");

const musicBtn =
    document.getElementById("musicBtn");

const musicText =
    document.getElementById("musicText");

const colorBackground =
    document.querySelector(".color-background");

const coralBed =
    document.querySelector(".coral-bed");

const fishField =
    document.querySelector(".fish-field");


/* =========================================================
   INITIAL STATE
========================================================= */

document.body.classList.add(
    "invitation-loading"
);


/* =========================================================
   VIDEO INITIAL STATE
========================================================= */

if (bgVideo) {

    bgVideo.pause();

    bgVideo.preload = "auto";

    bgVideo.muted = true;

    bgVideo.playsInline = true;

    bgVideo.style.opacity = "0";

}


/* =========================================================
   VIDEO LOADING STATE
========================================================= */

let videoMetadataReady = false;

let videoBufferReady = false;

let videoLoadingFinished = false;

let videoLoadFailed = false;

let videoLoadCheckTimer = null;

let videoProgressTimer = null;


const REQUIRED_BUFFER_SECONDS = 8;


/* =========================================================
   LOADING STATUS
========================================================= */

function setLoadingStatus(message) {

    if (!loadingStatus) {
        return;
    }


    loadingStatus.style.opacity = "0";


    setTimeout(() => {

        loadingStatus.textContent =
            message;

        loadingStatus.style.opacity =
            "1";

    }, 160);

}


/* =========================================================
   LOADING PROGRESS
========================================================= */

function setLoadingProgress(value) {

    if (!loadingProgress) {
        return;
    }


    const safeValue =
        Math.min(
            Math.max(value, 0),
            100
        );


    loadingProgress.style.width =
        `${safeValue}%`;

}


/* =========================================================
   SHOW VIEW INVITATION
========================================================= */

function showViewInvitation() {

    if (!viewInvitationWrapper) {
        return;
    }


    viewInvitationWrapper.classList.add(
        "ready"
    );

}


/* =========================================================
   GET BUFFERED SECONDS
========================================================= */

function getBufferedSeconds() {

    if (!bgVideo) {
        return 0;
    }


    if (
        !bgVideo.buffered ||
        bgVideo.buffered.length === 0
    ) {

        return 0;

    }


    try {

        const currentTime =
            bgVideo.currentTime || 0;


        for (
            let i = 0;
            i < bgVideo.buffered.length;
            i++
        ) {

            const start =
                bgVideo.buffered.start(i);

            const end =
                bgVideo.buffered.end(i);


            if (
                currentTime >= start &&
                currentTime <= end
            ) {

                return Math.max(
                    0,
                    end - currentTime
                );

            }

        }


        return Math.max(
            0,
            bgVideo.buffered.end(
                bgVideo.buffered.length - 1
            ) - currentTime
        );

    } catch (error) {

        return 0;

    }

}


/* =========================================================
   GET BUFFERED PERCENTAGE
========================================================= */

function getBufferedPercentage() {

    if (!bgVideo) {
        return 0;
    }


    const duration =
        bgVideo.duration;


    if (
        !Number.isFinite(duration) ||
        duration <= 0
    ) {

        return 0;

    }


    if (
        !bgVideo.buffered ||
        bgVideo.buffered.length === 0
    ) {

        return 0;

    }


    try {

        const currentTime =
            bgVideo.currentTime || 0;


        let bestEnd =
            currentTime;


        for (
            let i = 0;
            i < bgVideo.buffered.length;
            i++
        ) {

            const start =
                bgVideo.buffered.start(i);

            const end =
                bgVideo.buffered.end(i);


            if (
                currentTime >= start &&
                currentTime <= end
            ) {

                bestEnd = end;

                break;

            }


            if (
                end > bestEnd &&
                start <= currentTime + 0.1
            ) {

                bestEnd = end;

            }

        }


        return Math.min(
            100,
            Math.max(
                0,
                (
                    bestEnd /
                    duration
                ) * 100
            )
        );

    } catch (error) {

        return 0;

    }

}


/* =========================================================
   UPDATE VIDEO BUFFER PROGRESS
========================================================= */

function updateVideoProgress() {

    if (
        !bgVideo ||
        videoLoadingFinished
    ) {

        return;

    }


    const bufferedPercentage =
        getBufferedPercentage();


    if (bufferedPercentage > 0) {

        const visualProgress =
            Math.min(
                95,
                20 +
                (
                    bufferedPercentage *
                    0.75
                )
            );


        setLoadingProgress(
            visualProgress
        );


        if (
            bufferedPercentage >= 80
        ) {

            setLoadingStatus(
                "Almost ready..."
            );

        } else if (
            bufferedPercentage >= 40
        ) {

            setLoadingStatus(
                "Loading your invitation..."
            );

        }

    }

}


/* =========================================================
   MARK VIDEO READY
========================================================= */

function markVideoReady() {

    if (videoLoadingFinished) {
        return;
    }


    videoLoadingFinished = true;

    videoBufferReady = true;


    if (videoProgressTimer) {

        clearInterval(
            videoProgressTimer
        );

        videoProgressTimer = null;

    }


    if (videoLoadCheckTimer) {

        clearInterval(
            videoLoadCheckTimer
        );

        videoLoadCheckTimer = null;

    }


    setLoadingProgress(100);


    setLoadingStatus(
        "Your invitation is ready."
    );


    showViewInvitation();

}


/* =========================================================
   CHECK VIDEO BUFFER
========================================================= */

function checkVideoBuffer() {

    if (
        !bgVideo ||
        videoLoadingFinished ||
        videoLoadFailed
    ) {

        return;

    }


    if (
        !videoMetadataReady
    ) {

        return;

    }


    const duration =
        bgVideo.duration;


    const bufferedSeconds =
        getBufferedSeconds();


    const bufferedPercentage =
        getBufferedPercentage();


    const enoughBuffer =
        (
            duration > 0 &&
            bufferedSeconds >=
            Math.min(
                REQUIRED_BUFFER_SECONDS,
                duration * 0.85
            )
        );


    const almostFullyBuffered =
        (
            bufferedPercentage >= 90
        );


    if (
        enoughBuffer ||
        almostFullyBuffered
    ) {

        markVideoReady();

        return;

    }


    if (
        bufferedPercentage > 0
    ) {

        const progress =
            Math.min(
                94,
                20 +
                bufferedPercentage * 0.74
            );


        setLoadingProgress(
            progress
        );

    }

}


/* =========================================================
   PREPARE VIDEO
========================================================= */

function prepareVideo() {

    if (!bgVideo) {

        videoMetadataReady = true;

        videoBufferReady = true;

        markVideoReady();

        return;

    }


    setLoadingStatus(
        "Preparing the invitation..."
    );

    setLoadingProgress(5);


    bgVideo.addEventListener(
        "loadedmetadata",
        () => {

            videoMetadataReady = true;


            setLoadingProgress(15);


            setLoadingStatus(
                "Preparing the video..."
            );


            try {

                bgVideo.pause();

                bgVideo.currentTime = 0;

            } catch (error) {

                console.warn(
                    "Could not reset video:",
                    error
                );

            }


            checkVideoBuffer();

        }
    );


    bgVideo.addEventListener(
        "progress",
        () => {

            updateVideoProgress();

            checkVideoBuffer();

        }
    );


    bgVideo.addEventListener(
        "canplay",
        () => {

            videoMetadataReady = true;

            checkVideoBuffer();

        }
    );


    bgVideo.addEventListener(
        "canplaythrough",
        () => {

            videoMetadataReady = true;

            setLoadingProgress(96);

            checkVideoBuffer();

        }
    );


    bgVideo.addEventListener(
        "loadeddata",
        () => {

            videoMetadataReady = true;

            setLoadingProgress(20);

            checkVideoBuffer();

        }
    );


    bgVideo.addEventListener(
        "waiting",
        () => {

            if (!invitationStarted) {

                setLoadingStatus(
                    "Loading the invitation..."
                );

            }

        }
    );


    bgVideo.addEventListener(
        "stalled",
        () => {

            if (!invitationStarted) {

                setLoadingStatus(
                    "Still preparing the video..."
                );

            }

        }
    );


    bgVideo.addEventListener(
        "error",
        () => {

            videoLoadFailed = true;


            console.warn(
                "Background video could not be loaded."
            );


            if (!videoLoadingFinished) {

                setLoadingStatus(
                    "Your invitation is ready."
                );

                setLoadingProgress(100);

                showViewInvitation();

            }

        }
    );


    try {

        bgVideo.preload = "auto";

        bgVideo.load();

    } catch (error) {

        console.warn(
            "Could not start video preload:",
            error
        );


        videoLoadFailed = true;


        setLoadingProgress(100);

        setLoadingStatus(
            "Your invitation is ready."
        );

        showViewInvitation();

        return;

    }


    videoProgressTimer =
        setInterval(() => {

            updateVideoProgress();

            checkVideoBuffer();

        }, 250);


    videoLoadCheckTimer =
        setInterval(() => {

            if (videoLoadingFinished) {

                return;

            }


            checkVideoBuffer();


            const percentage =
                getBufferedPercentage();


            if (
                percentage >= 98
            ) {

                markVideoReady();

            }

        }, 1000);

}


/* =========================================================
   MUSIC STATE
========================================================= */

let isPlaying = false;


/* =========================================================
   START INVITATION
========================================================= */

async function startInvitation() {

    if (invitationStarted) {
        return;
    }


    invitationStarted = true;


    if (viewInvitationBtn) {

        viewInvitationBtn.disabled = true;

    }


    if (loadingScreen) {

        loadingScreen.classList.add(
            "hidden"
        );

    }


    document.body.classList.remove(
        "invitation-loading"
    );


    if (bgVideo) {

        bgVideo.style.opacity = "1";


        try {

            if (
                bgVideo.currentTime > 0.05
            ) {

                bgVideo.currentTime = 0;

            }


            await bgVideo.play();

        } catch (error) {

            console.warn(
                "Video playback could not start:",
                error
            );

        }

    }


    if (music) {

        try {

            await music.play();

            isPlaying = true;


            if (musicText) {

                musicText.textContent =
                    "Pause";

            }


            if (musicBtn) {

                musicBtn.classList.add(
                    "playing"
                );

            }

        } catch (error) {

            console.log(
                "Music requires another tap:",
                error
            );


            isPlaying = false;


            if (musicText) {

                musicText.textContent =
                    "Tap for music";

            }


            if (musicBtn) {

                musicBtn.classList.remove(
                    "playing"
                );

            }

        }

    }


    startCinematicHero();


    if (viewInvitationWrapper) {

        viewInvitationWrapper.classList.remove(
            "ready"
        );

    }


    if (musicBtn) {

        musicBtn.classList.remove(
            "hidden"
        );

    }


    setTimeout(() => {

        if (loadingScreen) {

            loadingScreen.style.display =
                "none";

        }

    }, 1100);

}


/* =========================================================
   VIEW INVITATION CLICK
========================================================= */

if (viewInvitationBtn) {

    viewInvitationBtn.addEventListener(
        "click",
        startInvitation
    );

}


/* =========================================================
   BACKGROUND MUSIC CONTROL
========================================================= */

if (musicBtn) {

    musicBtn.addEventListener(
        "click",
        async () => {

            if (!music) {
                return;
            }


            try {

                if (!isPlaying) {

                    await music.play();

                    isPlaying = true;


                    if (musicText) {

                        musicText.textContent =
                            "Pause";

                    }


                    musicBtn.classList.add(
                        "playing"
                    );

                } else {

                    music.pause();

                    isPlaying = false;


                    if (musicText) {

                        musicText.textContent =
                            "Tap for music";

                    }


                    musicBtn.classList.remove(
                        "playing"
                    );

                }

            } catch (error) {

                console.error(
                    "Music could not be played:",
                    error
                );

            }

        }
    );

}


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
            await fetch(
                "./guests.json",
                {
                    cache: "no-cache"
                }
            );


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

    return String(name || "")
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase();

}


/* =========================================================
   GET GUEST NAMES
========================================================= */

function getGuestNames(guest) {

    if (Array.isArray(guest.name)) {

        return guest.name;

    }

    return [guest.name];

}


/* =========================================================
   FIND GUESTS
========================================================= */

function findGuests(searchName) {

    const search =
        normalizeName(searchName);


    return guests.filter(guest => {

        const possibleNames =
            getGuestNames(guest);


        return possibleNames.some(
            name => {

                const normalizedName =
                    normalizeName(name);


                if (
                    normalizedName ===
                    search
                ) {

                    return true;

                }


                const firstName =
                    normalizedName
                        .split(" ")[0];


                return firstName ===
                    search;

            }
        );

    });

}


/* =========================================================
   GET DISPLAY NAME
========================================================= */

function getDisplayName(guest) {

    const names =
        getGuestNames(guest);


    return names[0] || "";

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(text) {

    const div =
        document.createElement("div");


    div.textContent =
        String(text || "");


    return div.innerHTML;

}


/* =========================================================
   FORMAT MESSAGE
========================================================= */

function formatGuestMessage(message) {

    return String(message || "")
        .trim()
        .split(/\n\s*\n/)
        .map(paragraph => {

            return `
                <p class="message-paragraph">
                    ${escapeHTML(paragraph).replace(/\n/g, "<br>")}
                </p>
            `;

        })
        .join("");

}


/* =========================================================
   SHOW GUEST MESSAGE
========================================================= */

function showGuestMessage(guest) {

    const displayName =
        getDisplayName(guest);


    const formattedMessage =
        formatGuestMessage(
            guest.message
        );


    const currentScrollPosition =
        window.scrollY;


    guestMessage.innerHTML = `

        <div class="message-divider"></div>

        <div class="message-text">

            <p class="message-greeting">

                Dear
                <strong>
                    ${escapeHTML(displayName)}
                </strong>,

            </p>

            <div class="message-body">

                ${formattedMessage}

            </div>


            <!-- =================================================
                 RSVP
            ================================================== -->

            <div class="rsvp-section">

                <div class="rsvp-divider"></div>

                <p class="rsvp-label">
                    RSVP
                </p>

                <h4 class="rsvp-title">
                    We hope you can join us.
                </h4>

                <p class="rsvp-text">
                    Please let us know if you’ll be able to
                    celebrate with us and if you’ll be bringing
                    a guest. Seating is limited, so this will
                    help us prepare a place for everyone.
                </p>

                <p class="rsvp-confirm">
                    Kindly confirm with:
                </p>

                <div class="rsvp-buttons">

                    <a
                        href="https://m.me/shean.dalo.2025"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="rsvp-button">

                        <span>
                            Confirm to Shean
                        </span>

                    </a>


                    <a
                        href="https://m.me/laydslyne"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="rsvp-button">

                        <span>
                            Confirm to Lyne
                        </span>

                    </a>

                </div>

            </div>

        </div>

    `;


    guestMessage.classList.add(
        "show"
    );


    requestAnimationFrame(() => {

        window.scrollTo(
            0,
            currentScrollPosition
        );

    });

}


/* =========================================================
   SHOW GUEST CHOICES
========================================================= */

function showGuestChoices(matches) {

    let buttons = "";


    matches.forEach(
        (guest, index) => {

            buttons += `

                <button
                    class="guest-choice"
                    data-index="${index}"
                    type="button">

                    ${escapeHTML(
                        getDisplayName(guest)
                    )}

                </button>

            `;

        }
    );


    guestMessage.innerHTML = `

        <div class="message-divider"></div>

        <div class="message-text">

            <p class="message-paragraph">

                We found a few guests with that name.

                <br><br>

                Please select your name.

            </p>

            <div class="guest-choices">

                ${buttons}

            </div>

        </div>

    `;


    guestMessage.classList.add(
        "show"
    );


    const choiceButtons =
        guestMessage.querySelectorAll(
            ".guest-choice"
        );


    choiceButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const index =
                        Number(
                            button.dataset.index
                        );


                    const selectedGuest =
                        matches[index];


                    showGuestMessage(
                        selectedGuest
                    );

                }
            );

        }
    );

}


/* =========================================================
   REVEAL GUEST MESSAGE
========================================================= */

function revealGuestMessage() {

    if (!guestName || !guestMessage) {
        return;
    }


    const input =
        guestName.value.trim();


    if (!input) {

        guestName.focus();


        guestMessage.innerHTML = `

            <div class="message-divider"></div>

            <div class="message-text validation-message">

                Please enter your name first.

            </div>

        `;


        guestMessage.classList.add(
            "show"
        );


        guestName.classList.remove(
            "name-required"
        );


        void guestName.offsetWidth;


        guestName.classList.add(
            "name-required"
        );


        return;

    }


    guestName.classList.remove(
        "name-required"
    );


    const matches =
        findGuests(input);


    if (matches.length === 0) {

        guestMessage.innerHTML = `

            <div class="message-divider"></div>

            <div class="message-text">

                <p class="message-paragraph">

                    We couldn't find your name
                    on our guest list.

                </p>

                <p class="message-paragraph">

                    Please try typing your first
                    name or full name.

                </p>

            </div>

        `;


        guestMessage.classList.add(
            "show"
        );

        return;

    }


    if (matches.length === 1) {

        showGuestMessage(
            matches[0]
        );

        return;

    }


    showGuestChoices(
        matches
    );

}


/* =========================================================
   ENTER KEY / INPUT
========================================================= */

if (guestName) {

    guestName.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {

                event.preventDefault();

                revealGuestMessage();

            }

        }
    );


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


                if (revealBtn) {

                    revealBtn.classList.add(
                        "ready"
                    );

                }

            } else {

                if (revealBtn) {

                    revealBtn.classList.remove(
                        "ready"
                    );

                }

            }

        }
    );

}


if (revealBtn) {

    revealBtn.addEventListener(
        "click",
        revealGuestMessage
    );

}


/* =========================================================
   BACKGROUND SCROLL EFFECT
========================================================= */

let currentScroll = 0;

let targetScroll = 0;

let bgAnimationFrameId = null;


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


    if (bgAnimationFrameId === null) {

        bgAnimationFrameId =
            requestAnimationFrame(
                animateBackground
            );

    }

}


function animateBackground() {

    const distanceToTarget =
        Math.abs(
            targetScroll -
            currentScroll
        );


    if (distanceToTarget < 0.5) {

        currentScroll =
            targetScroll;

        bgAnimationFrameId = null;

        return;

    }


    currentScroll +=
        (
            targetScroll -
            currentScroll
        ) * .055;


    const maxScroll =
        Math.max(
            document.documentElement.scrollHeight -
            window.innerHeight,
            1
        );


    const scrollProgress =
        Math.min(
            Math.max(
                currentScroll /
                maxScroll,
                0
            ),
            1
        );


    if (
        invitationStarted &&
        bgVideo
    ) {

        const fadeStart =
            .015;

        const fadeEnd =
            .24;


        let videoProgress =
            (
                scrollProgress -
                fadeStart
            ) /
            (
                fadeEnd -
                fadeStart
            );


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
            (
                3 -
                2 * videoProgress
            );


        bgVideo.style.opacity =
            1 -
            smoothFade;

    }


    if (colorBackground) {

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
                .95
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
                .95
            ) * 9;


        colorBackground.style.backgroundPosition =
            `${positionX}% ${positionY}%`;

    }


    /* =====================================================
       PARALLAX: CORAL BED + FISH FIELD

       Reuses this same rAF loop (already running for the
       background gradient drift) instead of adding a second
       scroll listener, so there's no extra main-thread cost.
    ===================================================== */

    if (coralBed) {

        const coralDrift =
            scrollProgress * 26;


        coralBed.style.transform =
            `translateY(${coralDrift}px)`;

    }


    if (fishField) {

        const fishDrift =
            scrollProgress * -14;


        fishField.style.transform =
            `translateY(${fishDrift}px)`;

    }


    bgAnimationFrameId =
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


/* =========================================================
   CINEMATIC HERO
========================================================= */

let cinematicStarted = false;


function startCinematicHero() {

    if (cinematicStarted) {
        return;
    }


    cinematicStarted = true;


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


    function reveal(element) {

        if (element) {

            element.classList.add(
                "show"
            );

        }

    }


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

    }, 4800);


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
                (
                    viewportHeight *
                    .52
                );


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


/* =========================================================
   ULTRA-SMOOTH SCROLL
========================================================= */

function smoothScrollTo(
    target,
    duration
) {

    const start =
        window.scrollY;


    const distance =
        target -
        start;


    const startTime =
        performance.now();


    function easeInOutCubic(t) {

        return t < .5

            ? 4 *
                t *
                t *
                t

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
                elapsed /
                duration,
                1
            );


        const eased =
            easeInOutCubic(
                progress
            );


        window.scrollTo(
            0,
            start +
            distance *
            eased
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


/* =========================================================
   SCROLL REVEAL (PER SECTION)

   Watches every ".reveal" section except the hero (which
   already runs its own timed cinematic sequence from
   startCinematicHero) and adds ".in-view" the first time
   each one crosses into the viewport, matching the CSS
   transition defined for ".reveal:not(.hero)".

   Each section is only revealed once, then unobserved, so
   scrolling back up and down doesn't re-trigger the animation.
========================================================= */

function initScrollReveal() {

    const sections =
        document.querySelectorAll(
            "section.reveal:not(.hero)"
        );


    if (!sections.length) {
        return;
    }


    const prefersReducedMotion =
        window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;


    if (
        prefersReducedMotion ||
        !("IntersectionObserver" in window)
    ) {

        sections.forEach(section => {

            section.classList.add(
                "in-view"
            );

        });


        return;

    }


    const revealObserver =
        new IntersectionObserver(
            (entries, observer) => {

                entries.forEach(entry => {

                    if (
                        entry.isIntersecting
                    ) {

                        entry.target.classList.add(
                            "in-view"
                        );


                        observer.unobserve(
                            entry.target
                        );

                    }

                });

            },
            {
                threshold: .18,
                rootMargin:
                    "0px 0px -8% 0px"
            }
        );


    sections.forEach(section => {

        revealObserver.observe(
            section
        );

    });

}


/* =========================================================
   START
========================================================= */

loadGuests();

prepareVideo();

initScrollReveal();