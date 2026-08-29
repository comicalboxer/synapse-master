const yearNode =
  document.querySelector("#year");

if (yearNode) {
  yearNode.textContent =
    new Date().getFullYear();
}


/* =========================================
   DYNAMIC NEURAL PATHWAY BACKGROUND
========================================= */

const canvas =
  document.createElement("canvas");

canvas.className =
  "neural-canvas";

canvas.setAttribute(
  "aria-hidden",
  "true"
);

document.body.prepend(canvas);


const ctx =
  canvas.getContext("2d");


let nodes = [];
let edges = [];

let rafId = 0;

let lastScrollY =
  window.scrollY;

let scrollVelocity = 0;

let scrollProgress = 0;


/* =========================================
   PAGE HEIGHT
========================================= */

function getPageHeight() {

  return Math.max(
    document.documentElement.scrollHeight,

    document.body.scrollHeight,

    window.innerHeight
  );

}


/* =========================================
   BUILD NEURAL FIELD
========================================= */

function buildNeuralField() {

  const pageHeight =
    getPageHeight();


  const density =
    Math.max(
      42,

      Math.min(
        110,

        Math.floor(
          (
            window.innerWidth *
            pageHeight
          ) / 30000
        )
      )
    );


  nodes =
    Array.from(
      {
        length: density
      },

      (_, index) => ({

        x:
          Math.random() *
          window.innerWidth,

        y:
          Math.random() *
          pageHeight,

        radius:
          0.8 +
          Math.random() *
          1.7,

        phase:
          Math.random() *
          Math.PI *
          2,

        speed:
          0.45 +
          Math.random() *
          0.7,

        drift:
          8 +
          Math.random() *
          22,

        index

      })
    );


  edges = [];


  for (
    let i = 0;
    i < nodes.length;
    i += 1
  ) {

    const candidates = [];


    for (
      let j = 0;
      j < nodes.length;
      j += 1
    ) {

      if (i === j) {
        continue;
      }


      const a =
        nodes[i];

      const b =
        nodes[j];


      const distance =
        Math.hypot(
          a.x - b.x,
          a.y - b.y
        );


      if (distance < 235) {

        candidates.push({
          index: j,
          distance
        });

      }

    }


    candidates
      .sort(
        (a, b) =>
          a.distance -
          b.distance
      )

      .slice(0, 3)

      .forEach(
        (candidate) => {

          const exists =
            edges.some(
              (edge) =>
                (
                  edge.a === i &&
                  edge.b ===
                    candidate.index
                )

                ||

                (
                  edge.a ===
                    candidate.index &&
                  edge.b === i
                )
            );


          if (!exists) {

            edges.push({

              a: i,

              b:
                candidate.index,

              phase:
                Math.random(),

              speed:
                0.18 +
                Math.random() *
                  0.35

            });

          }

        }
      );

  }

}


/* =========================================
   CANVAS RESIZE
========================================= */

function resizeCanvas() {

  const dpr =
    Math.min(
      window.devicePixelRatio ||
        1,

      2
    );


  canvas.width =
    Math.floor(
      window.innerWidth *
        dpr
    );


  canvas.height =
    Math.floor(
      window.innerHeight *
        dpr
    );


  canvas.style.width =
    `${window.innerWidth}px`;


  canvas.style.height =
    `${window.innerHeight}px`;


  ctx.setTransform(
    dpr,
    0,
    0,
    dpr,
    0,
    0
  );


  buildNeuralField();

}


/* =========================================
   SCROLL STATE
========================================= */

function updateScrollState() {

  const maxScroll =
    Math.max(
      1,

      getPageHeight() -
        window.innerHeight
    );


  scrollProgress =
    Math.min(
      1,

      Math.max(
        0,

        window.scrollY /
          maxScroll
      )
    );


  const delta =
    window.scrollY -
    lastScrollY;


  scrollVelocity +=
    (
      delta -
      scrollVelocity
    ) *
    0.12;


  lastScrollY =
    window.scrollY;

}


/* =========================================
   DRAW NEURAL FIELD
========================================= */

function drawNeuralField(time) {

  updateScrollState();


  ctx.clearRect(
    0,
    0,
    window.innerWidth,
    window.innerHeight
  );


  /*
   * Scroll changes the movement
   * of the neural network.
   */

  const driftAmount =
    scrollProgress *
      26 +

    scrollVelocity *
      0.08;


  const visibleNodes = [];


  nodes.forEach(
    (node) => {

      const drift =
        Math.sin(
          time *
            0.00045 *
            node.speed +

          node.phase
        ) *
        node.drift;


      const x =
        node.x +

        Math.sin(
          node.phase
        ) *
          scrollProgress *
          18;


      const y =
        node.y -

        window.scrollY +

        drift -

        driftAmount;


      if (
        y >= -160 &&
        y <=
          window.innerHeight +
            160
      ) {

        visibleNodes.push({
          ...node,
          x,
          y
        });

      }

    }
  );


  const visibleByIndex =
    new Map(
      visibleNodes.map(
        (node) => [
          node.index,
          node
        ]
      )
    );


  /* =========================================
     DRAW NEURAL CONNECTIONS
  ========================================== */

  edges.forEach(
    (edge) => {

      const a =
        visibleByIndex.get(
          edge.a
        );


      const b =
        visibleByIndex.get(
          edge.b
        );


      if (!a || !b) {
        return;
      }


      const distance =
        Math.hypot(
          a.x - b.x,
          a.y - b.y
        );


      const strength =
        Math.max(
          0,

          1 -
            distance /
              235
        );


      const opacity =
        0.06 +

        strength *
          (
            0.11 +
            scrollProgress *
              0.14
          );


      ctx.beginPath();

      ctx.moveTo(
        a.x,
        a.y
      );

      ctx.lineTo(
        b.x,
        b.y
      );


      ctx.strokeStyle =
        `rgba(
          76,
          137,
          255,
          ${opacity}
        )`;


      ctx.lineWidth =
        0.55 +
        scrollProgress *
          0.3;


      ctx.stroke();


      /* =========================================
         TRAVELLING SIGNAL
      ========================================== */

      const signal =
        (
          edge.phase +

          time *
            0.00008 *
            edge.speed +

          scrollProgress *
            0.55

        ) % 1;


      if (
        strength >
        0.45
      ) {

        const sx =
          a.x +

          (
            b.x -
            a.x
          ) *
            signal;


        const sy =
          a.y +

          (
            b.y -
            a.y
          ) *
            signal;


        ctx.beginPath();


        ctx.arc(
          sx,
          sy,

          1.1 +
            scrollProgress *
              0.9,

          0,

          Math.PI * 2
        );


        ctx.fillStyle =
          `rgba(
            100,
            194,
            255,
            ${
              0.18 +
              scrollProgress *
                0.28
            }
          )`;


        ctx.shadowBlur =
          7 +
          scrollProgress *
            8;


        ctx.shadowColor =
          "rgba(73, 144, 255, 0.55)";


        ctx.fill();


        ctx.shadowBlur = 0;

      }

    }
  );


  /* =========================================
     DRAW NEURONS
  ========================================== */

  visibleNodes.forEach(
    (node) => {

      const pulse =
        0.72 +

        Math.sin(
          time *
            0.001 *
            node.speed +

          node.phase
        ) *

        (
          0.14 +
          scrollProgress *
            0.08
        );


      ctx.beginPath();


      ctx.arc(
        node.x,
        node.y,

        node.radius *
          pulse,

        0,

        Math.PI * 2
      );


      ctx.fillStyle =
        `rgba(
          105,
          171,
          255,
          ${
            0.18 +
            scrollProgress *
              0.18
          }
        )`;


      ctx.shadowBlur =
        7 +
        scrollProgress *
          9;


      ctx.shadowColor =
        "rgba(73, 124, 255, 0.42)";


      ctx.fill();


      ctx.shadowBlur = 0;

    }
  );


  rafId =
    requestAnimationFrame(
      drawNeuralField
    );

}


/* =========================================
   INITIALIZE BACKGROUND
========================================= */

resizeCanvas();


window.addEventListener(
  "resize",
  resizeCanvas,
  {
    passive: true
  }
);


window.addEventListener(
  "scroll",
  updateScrollState,
  {
    passive: true
  }
);


requestAnimationFrame(
  drawNeuralField
);


/* =========================================
   SCROLL REVEAL
========================================= */

const revealItems =
  document.querySelectorAll(
    ".reveal"
  );


const revealObserver =
  new IntersectionObserver(

    (
      entries,
      observer
    ) => {

      entries.forEach(
        (entry) => {

          if (
            !entry.isIntersecting
          ) {
            return;
          }


          entry.target.classList.add(
            "is-visible"
          );


          observer.unobserve(
            entry.target
          );

        }
      );

    },

    {
      threshold: 0.14,

      rootMargin:
        "0px 0px -7% 0px"
    }

  );


revealItems.forEach(
  (item) =>
    revealObserver.observe(
      item
    )
);


/* =========================================
   RIGHT-SIDE NAVIGATION
========================================= */

const navLinks = [
  ...document.querySelectorAll(
    ".side-nav-link"
  )
];


const sections =
  navLinks

    .map(
      (link) =>
        document.querySelector(
          link.getAttribute(
            "href"
          )
        )
    )

    .filter(Boolean);


const sectionObserver =
  new IntersectionObserver(

    (entries) => {

      entries.forEach(
        (entry) => {

          if (
            !entry.isIntersecting
          ) {
            return;
          }


          navLinks.forEach(
            (link) => {

              link.classList.toggle(

                "active",

                link.getAttribute(
                  "href"
                ) ===
                  `#${entry.target.id}`

              );

            }
          );

        }
      );

    },

    {
      rootMargin:
        "-44% 0px -44% 0px",

      threshold: 0
    }

  );


sections.forEach(
  (section) =>
    sectionObserver.observe(
      section
    )
);


/* =========================================
   TEAM MEMBERS
========================================= */

const teamMembers = [

  [
    "Vaanya Kshatriya",
    "President",

    "CORE TEAM/Vaanya.png"
  ],

  [
    "Kshreeraja Alegaonkar",
    "Vice President",

    "CORE TEAM/Kshreeraja.png"
  ],

  [
    "Pranvikant Mishra",
    "Joint Secretary",

    "CORE TEAM/Pranvi And Swarit.png"
  ],

  [
    "Swarit Somani",
    "Joint Secretary",

    "CORE TEAM/Pranvi And Swarit.png"
  ],

  [
    "Ananya Bhusari",
    "Treasurer",

    "CORE TEAM/Ananya.png"
  ],

  [
    "Ibrahim Knot",
    "Tech Head",

    "CORE TEAM/ibrahim.png"
  ],

  [
    "Shreeya Huddar",
    "Design Co-Head",

    "CORE TEAM/shreeya and swara.png"
  ],

  [
    "Swara Lande",
    "Design Co-Head",

    "CORE TEAM/shreeya and swara.png"
  ],

  [
    "Praneel Chabbria",
    "Speaker Relations",

    "CORE TEAM/Praneel.png"
  ],

  [
    "Ria Jogi",
    "Social Media Head",

    "CORE TEAM/Ria.png"
  ]

];


/* =========================================
   TEAM CAROUSEL
========================================= */

const stage =
  document.querySelector(
    ".team-stage"
  );


if (stage) {

  const images = {

    left:
      stage.querySelector(
        ".team-image-left img"
      ),

    center:
      stage.querySelector(
        ".team-image-center img"
      ),

    right:
      stage.querySelector(
        ".team-image-right img"
      )

  };


  const nameNode =
    document.querySelector(
      "#team-name"
    );


  const roleNode =
    document.querySelector(
      "#team-role"
    );


  const dots = [
    ...document.querySelectorAll(
      ".team-dot"
    )
  ];


  const previousButton =
    document.querySelector(
      "#team-prev"
    );


  const nextButton =
    document.querySelector(
      "#team-next"
    );


  let current = 0;

  let carouselTimer = null;


  /* =========================================
     RENDER TEAM STATE
  ========================================== */

  function render(
    index,
    animate = true
  ) {

    const total =
      teamMembers.length;


    const normalized =
      (
        index +
        total
      ) % total;


    const members = {

      left:
        teamMembers[
          (
            normalized -
            1 +
            total
          ) % total
        ],

      center:
        teamMembers[
          normalized
        ],

      right:
        teamMembers[
          (
            normalized +
            1
          ) % total
        ]

    };


    Object.entries(
      members
    ).forEach(
      (
        [
          position,
          member
        ]
      ) => {

        const image =
          images[position];


        if (!image) {
          return;
        }


        if (animate) {

          image.classList.add(
            "is-swapping"
          );

        }


        window.setTimeout(
          () => {

            image.src =
              member[2];


            image.alt =
              `${member[0]} — ${member[1]}`;


            image.classList.remove(
              "is-swapping"
            );

          },

          animate
            ? 170
            : 0
        );

      }
    );


    if (nameNode) {

      nameNode.textContent =
        members.center[0];

    }


    if (roleNode) {

      roleNode.textContent =
        members.center[1];

    }


    dots.forEach(
      (
        dot,
        i
      ) => {

        dot.classList.toggle(
          "is-active",

          i ===
            normalized
        );


        dot.setAttribute(

          "aria-label",

          `Show team member ${
            i + 1
          }: ${
            teamMembers[i][0]
          }`

        );

      }
    );


    current =
      normalized;

  }


  /* =========================================
     AUTO ROTATION
  ========================================== */

  function restartAutoRotation() {

    if (carouselTimer) {

      window.clearInterval(
        carouselTimer
      );

    }


    carouselTimer =
      window.setInterval(

        () =>
          render(
            current + 1
          ),

        4200

      );

  }


  /* Initial state */

  render(
    0,
    false
  );


  restartAutoRotation();


  /* =========================================
     PREVIOUS BUTTON
  ========================================== */

  previousButton?.addEventListener(
    "click",

    () => {

      render(
        current - 1
      );

      restartAutoRotation();

    }
  );


  /* =========================================
     NEXT BUTTON
  ========================================== */

  nextButton?.addEventListener(
    "click",

    () => {

      render(
        current + 1
      );

      restartAutoRotation();

    }
  );


  /* =========================================
     DOT NAVIGATION
  ========================================== */

  dots.forEach(
    (
      dot,
      index
    ) => {

      dot.addEventListener(
        "click",

        () => {

          render(
            index
          );

          restartAutoRotation();

        }
      );

    }
  );


  /* =========================================
     KEYBOARD NAVIGATION
  ========================================== */

  stage.addEventListener(
    "keydown",

    (event) => {

      if (
        event.key ===
        "ArrowLeft"
      ) {

        event.preventDefault();

        render(
          current - 1
        );

        restartAutoRotation();

      }


      if (
        event.key ===
        "ArrowRight"
      ) {

        event.preventDefault();

        render(
          current + 1
        );

        restartAutoRotation();

      }

    }
  );


  stage.tabIndex = 0;


  /* =========================================
     CLEANUP
  ========================================== */

  window.addEventListener(
    "pagehide",

    () => {

      if (carouselTimer) {

        window.clearInterval(
          carouselTimer
        );

      }

    }
  );

}


/* =========================================
   REDUCED MOTION
========================================= */

if (
  window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches
) {

  document.documentElement.classList.add(
    "reduce-motion"
  );


  cancelAnimationFrame(
    rafId
  );

}
