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


/* =========================================================
   INITIAL STATE
========================================================= */

document.body.classList.add(
    "invitation-loading"
);


/* =========================================================
   CONNECTION-AWARE LOADING
   ---------------------------------------------------------
   On slow / metered connections we don't want to force the
   user to wait for a big video to buffer. We detect this
   once up front and use it to shrink the buffer requirement
   and the maximum time we're willing to make anyone wait.
========================================================= */

const networkInfo =
    navigator.connection ||
    navigator.mozConnection ||
    navigator.webkitConnection ||
    null;

const isSlowConnection =
    !!(
        networkInfo &&
        (
            networkInfo.saveData === true ||
            /^(slow-2g|2g|3g)$/.test(
                networkInfo.effectiveType || ""
            )
        )
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

let maxWaitTimer = null;


/*
 * We only need the video to be sufficiently buffered
 * before allowing the invitation to start.
 *
 * Since your video is only around 10 seconds,
 * we aim to have a good chunk of it buffered — but not
 * so much that people on weak connections get stuck
 * staring at a loading screen.
 */

const REQUIRED_BUFFER_SECONDS =
    isSlowConnection ? 1.5 : 3;

/*
 * HARD SAFETY CAP.
 *
 * No matter how slow the connection is, or how far the
 * video is from "fully ready", the invitation must be
 * reachable within this many milliseconds. The video
 * keeps downloading in the background and will simply
 * fade in whenever it's actually ready (see the opacity
 * fade in startInvitation / animateBackground).
 */

const MAX_LOADING_WAIT_MS =
    isSlowConnection ? 2200 : 4500;


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
   ROTATING LOADING MESSAGES

   The status text used to only change when a buffer
   percentage threshold was crossed — for a short 10-second
   video that happens almost instantly, so the same message
   would sit on screen doing nothing for several seconds and
   feel stuck. This rotates through a set of ocean-themed
   phrases on a fixed timer instead, so there's always
   something new to read while things load.
========================================================= */

const LOADING_MESSAGES = [
    "Preparing your invitation...",
    "Gathering pearls and starlight...",
    "Smoothing the waves for you...",
    "Setting the underwater scene...",
    "Almost time to dive in...",
    "Just a few more ripples...",
];

let loadingMessageIndex = 0;

let loadingMessageTimer = null;


function startLoadingMessageRotation() {

    if (loadingMessageTimer) {
        return;
    }


    loadingMessageIndex = 0;

    setLoadingStatus(
        LOADING_MESSAGES[loadingMessageIndex]
    );


    loadingMessageTimer =
        setInterval(() => {

            loadingMessageIndex =
                (loadingMessageIndex + 1) %
                LOADING_MESSAGES.length;

            setLoadingStatus(
                LOADING_MESSAGES[loadingMessageIndex]
            );

        }, 1800);

}


function stopLoadingMessageRotation() {

    if (loadingMessageTimer) {

        clearInterval(loadingMessageTimer);

        loadingMessageTimer = null;

    }

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


            /*
             * Find the range containing
             * the current playback position.
             */

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


        /*
         * If currentTime is not inside a range,
         * use the latest buffered range.
         */

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

        /*
         * Keep progress below 100 until
         * the required buffer is actually ready.
         */

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

        /*
         * Text itself is handled by the rotating
         * loading-message system now — this only
         * drives the progress bar fill.
         */

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


    if (videoLoadCheckTimer) {

        clearInterval(
            videoLoadCheckTimer
        );

        videoLoadCheckTimer = null;

    }


    if (maxWaitTimer) {

        clearTimeout(
            maxWaitTimer
        );

        maxWaitTimer = null;

    }


    stopLoadingMessageRotation();


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


    /*
     * For a short 10-second video:
     *
     * - If almost the entire video is buffered,
     *   allow it immediately.
     *
     * - Otherwise require at least the target amount.
     */

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


    /*
     * Update visual loading.
     */

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


    startLoadingMessageRotation();

    setLoadingProgress(5);


    /*
     * SLOW CONNECTION FAST PATH:
     *
     * Don't even try to buffer the video before letting
     * people in — on a weak connection that can take a
     * very long time and the video isn't essential to
     * using the invitation. We still start the download
     * (it may finish later and fade in), but we stop
     * blocking on it almost immediately.
     */

    if (isSlowConnection) {

        try {

            bgVideo.load();

        } catch (error) {

            console.warn(
                "Could not start video preload:",
                error
            );

        }


        maxWaitTimer =
            setTimeout(
                markVideoReady,
                MAX_LOADING_WAIT_MS
            );


        return;

    }


    /*
     * IMPORTANT:
     * Listeners are attached BEFORE load().
     */


    /* =====================================================
       METADATA
    ===================================================== */

    bgVideo.addEventListener(
        "loadedmetadata",
        () => {

            videoMetadataReady = true;


            setLoadingProgress(15);


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


    /* =====================================================
       PROGRESS
    ===================================================== */

    bgVideo.addEventListener(
        "progress",
        () => {

            updateVideoProgress();

            checkVideoBuffer();

        }
    );


    /* =====================================================
       CAN PLAY
    ===================================================== */

    bgVideo.addEventListener(
        "canplay",
        () => {

            /*
             * DO NOT mark ready here.
             *
             * canplay only means the browser can
             * start playback. It does NOT guarantee
             * enough buffering for uninterrupted playback.
             */

            videoMetadataReady = true;

            checkVideoBuffer();

        }
    );


    /* =====================================================
       CAN PLAY THROUGH
    ===================================================== */

    bgVideo.addEventListener(
        "canplaythrough",
        () => {

            /*
             * This is a stronger signal that the browser
             * expects continuous playback.
             */

            videoMetadataReady = true;

            setLoadingProgress(96);

            checkVideoBuffer();

        }
    );


    /* =====================================================
       LOADED DATA
    ===================================================== */

    bgVideo.addEventListener(
        "loadeddata",
        () => {

            videoMetadataReady = true;

            setLoadingProgress(20);

            checkVideoBuffer();

        }
    );


    /* =====================================================
       ERROR
    ===================================================== */

    bgVideo.addEventListener(
        "error",
        () => {

            videoLoadFailed = true;


            console.warn(
                "Background video could not be loaded."
            );


            /*
             * We don't trap the user on the loading screen.
             */

            if (!videoLoadingFinished) {

                markVideoReady();

            }

        }
    );


    /* =====================================================
       START PRELOAD
    ===================================================== */

    try {

        bgVideo.preload = "auto";

        bgVideo.load();

    } catch (error) {

        console.warn(
            "Could not start video preload:",
            error
        );

        videoLoadFailed = true;

        markVideoReady();

        return;

    }


    /* =====================================================
       SINGLE CONTINUOUS BUFFER CHECK

       PERFORMANCE FIX: this used to be two separate
       setInterval loops (one every 250ms, one every
       1000ms) running at the same time. That's extra
       main-thread work competing with video decode for
       no real benefit — one loop covers both jobs.
    ===================================================== */

    videoLoadCheckTimer =
        setInterval(() => {

            if (videoLoadingFinished) {
                return;
            }


            updateVideoProgress();

            checkVideoBuffer();


            const percentage =
                getBufferedPercentage();


            if (percentage >= 98) {

                markVideoReady();

            }

        }, 400);


    /* =====================================================
       HARD SAFETY CAP

       Whatever happens with buffering, never make anyone
       wait longer than this for the invitation itself.
    ===================================================== */

    maxWaitTimer =
        setTimeout(() => {

            if (!videoLoadingFinished) {

                markVideoReady();

            }

        }, MAX_LOADING_WAIT_MS);

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


    /* =====================================================
       HIDE LOADING SCREEN
    ===================================================== */

    if (loadingScreen) {

        loadingScreen.classList.add(
            "hidden"
        );

    }


    document.body.classList.remove(
        "invitation-loading"
    );


    /* =====================================================
       VIDEO
    ===================================================== */

    if (bgVideo && !videoLoadFailed) {

        /*
         * IMPORTANT:
         *
         * DO NOT call:
         * bgVideo.load()
         *
         * DO NOT reset currentTime unnecessarily.
         *
         * The video has already been preloaded (or is
         * still downloading in the background on a slow
         * connection — play() will simply start whenever
         * enough of it is available).
         */

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


    /* =====================================================
       MUSIC
    ===================================================== */

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


    /* =====================================================
       START CINEMATIC HERO
    ===================================================== */

    startCinematicHero();


    /* =====================================================
       HIDE VIEW INVITATION
    ===================================================== */

    if (viewInvitationWrapper) {

        viewInvitationWrapper.classList.remove(
            "ready"
        );

    }


    /* =====================================================
       SHOW MUSIC BUTTON
    ===================================================== */

    if (musicBtn) {

        musicBtn.classList.remove(
            "hidden"
        );

    }


    /* =====================================================
       REMOVE LOADING SCREEN COMPLETELY
    ===================================================== */

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

let guestsLoaded = false;

let guestsLoadPromise = null;


/* =========================================================
   LOAD GUESTS

   PERFORMANCE FIX: this used to fire immediately on page
   load, competing with the video/font/image requests that
   actually matter for the first paint. It's now lazy —
   only fetched the first time someone actually tries to
   reveal a message — and reveal() just awaits it if it's
   still in flight.
========================================================= */

function loadGuests() {

    if (guestsLoadPromise) {
        return guestsLoadPromise;
    }


    guestsLoadPromise = (async () => {

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

            guestsLoaded = true;

        } catch (error) {

            console.error(
                "Error loading guests.json:",
                error
            );

        }

    })();


    return guestsLoadPromise;

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

async function revealGuestMessage() {

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


    if (!guestsLoaded) {

        guestMessage.innerHTML = `

            <div class="message-divider"></div>

            <div class="message-text">

                <p class="message-paragraph">
                    One moment...
                </p>

            </div>

        `;

        guestMessage.classList.add(
            "show"
        );

        await loadGuests();

    }


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

   PERFORMANCE FIX:
   The old version ran requestAnimationFrame() forever,
   60 times per second, for the entire lifetime of the page
   — even while the user wasn't scrolling at all. That
   constant work (trig math + DOM style writes every frame)
   competes with the video decoder for the main thread and
   is a common cause of video stutter, especially on phones.

   Now the animation loop only runs while it still has
   something to animate (i.e. while currentScroll hasn't
   caught up to targetScroll yet), and stops itself once it
   settles. It's restarted automatically on the next scroll.
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


    /*
     * Wake the animation loop back up if it had
     * settled and stopped itself.
     */

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


    /*
     * Close enough — snap to the target and stop
     * the loop instead of running forever.
     */

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


    /* =====================================================
       VIDEO FADE
    ===================================================== */

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


    /* =====================================================
       BACKGROUND MOVEMENT
    ===================================================== */

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


    /* =====================================================
       AUTOMATIC SMOOTH SCROLL
    ===================================================== */

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


            /* =================================================
               INPUT PULSE
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
   COUNTDOWN TIMER

   Counts down to the event date/time set in the
   data-event-datetime attribute on #countdownTimer.
   Uses a plain setInterval (1x per second) — cheap enough
   that it won't compete with video playback.
========================================================= */

function initCountdownTimer() {

    const countdownEl =
        document.getElementById("countdownTimer");


    if (!countdownEl) {
        return;
    }


    const targetDateString =
        countdownEl.dataset.eventDatetime;


    const targetDate =
        new Date(targetDateString);


    if (
        !targetDateString ||
        Number.isNaN(targetDate.getTime())
    ) {

        console.warn(
            "Countdown: invalid event date/time."
        );

        return;

    }


    const daysEl =
        document.getElementById("cdDays");

    const hoursEl =
        document.getElementById("cdHours");

    const minutesEl =
        document.getElementById("cdMinutes");

    const secondsEl =
        document.getElementById("cdSeconds");


    function pad(number) {

        return String(number)
            .padStart(2, "0");

    }


    let countdownInterval = null;


    function updateCountdown() {

        const now =
            new Date();

        const diff =
            targetDate.getTime() -
            now.getTime();


        if (diff <= 0) {

            if (daysEl) daysEl.textContent = "00";
            if (hoursEl) hoursEl.textContent = "00";
            if (minutesEl) minutesEl.textContent = "00";
            if (secondsEl) secondsEl.textContent = "00";

            if (countdownInterval) {

                clearInterval(countdownInterval);

            }

            return;

        }


        const totalSeconds =
            Math.floor(diff / 1000);

        const days =
            Math.floor(totalSeconds / 86400);

        const hours =
            Math.floor(
                (totalSeconds % 86400) / 3600
            );

        const minutes =
            Math.floor(
                (totalSeconds % 3600) / 60
            );

        const seconds =
            totalSeconds % 60;


        if (daysEl) daysEl.textContent = pad(days);
        if (hoursEl) hoursEl.textContent = pad(hours);
        if (minutesEl) minutesEl.textContent = pad(minutes);
        if (secondsEl) secondsEl.textContent = pad(seconds);

    }


    updateCountdown();


    countdownInterval =
        setInterval(updateCountdown, 1000);

}


/* =========================================================
   START
========================================================= */

prepareVideo();

initCountdownTimer();