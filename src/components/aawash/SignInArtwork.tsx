const reference = "/images/sign-in-reference-art.jpg";

export function SignInArtwork() {
  return (
    <svg className="signin-art" viewBox="0 0 864 1536" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id="signin-scenery">
          <path d="M0 0H296V141H164V247H0Z M804 0H864V262H572Q665 80 804 0Z M380 65H493V183H380Z" />
          <path d="M266 350C331 367 377 389 426 424C527 363 638 320 718 337C762 346 799 386 800 446V652C776 613 729 588 670 575C526 539 462 464 368 403Z" />
        </clipPath>
        <clipPath id="signin-street">
          <path d="M0 1160H62L120 1194H747L806 1147H864V1536H0Z" />
        </clipPath>
        <linearGradient id="signin-card-base" x2="0.9" y2="1">
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#e1e2e4" />
        </linearGradient>
        <linearGradient id="signin-card-green" x1="0" y1="0" x2=".8" y2="1">
          <stop stopColor="#656c57" />
          <stop offset=".7" stopColor="#3a3f2f" />
          <stop offset="1" stopColor="#747a66" />
        </linearGradient>
        <linearGradient id="signin-card-paper" x1=".15" y1=".15" x2=".97" y2=".8">
          <stop stopColor="#fefefe" />
          <stop offset=".53" stopColor="#fefefd" />
          <stop offset=".86" stopColor="#e8ecdd" />
          <stop offset="1" stopColor="#f7f8f5" />
        </linearGradient>
        <linearGradient id="signin-line" x2="0" y2="1">
          <stop stopColor="#3f4534" />
          <stop offset="1" stopColor="#b3b7ac" stopOpacity="0" />
        </linearGradient>
        <filter id="signin-paper-shadow" x="-.12" y="-.12" width="1.24" height="1.27">
          <feDropShadow dx="0" dy="15" stdDeviation="20" floodColor="#2c2e29" floodOpacity=".16" />
        </filter>
      </defs>
      <image href={reference} width="864" height="1536" clipPath="url(#signin-scenery)" />
      <image href={reference} width="864" height="1536" clipPath="url(#signin-street)" opacity=".10" />
      <path d="M96 413C145 333 226 328 309 367C424 419 489 503 590 543C684 581 768 565 792 662C804 706 801 805 798 859C794 961 757 1003 625 1000C461 995 365 1007 239 1019C137 1029 66 985 65 900V495C65 466 76 440 96 413Z"
        fill="url(#signin-card-base)" stroke="#fff" strokeWidth="2.5" filter="url(#signin-paper-shadow)" />
      <path d="M198 350C354 345 453 463 556 529C660 596 747 570 785 645C801 676 799 719 798 788L796 869C793 956 742 1000 633 997C449 994 337 1013 222 1010L170 989Z"
        fill="url(#signin-card-green)" stroke="#fff" strokeWidth="2" />
      <path d="M96 427C128 347 211 332 293 365C414 413 483 502 597 546C692 582 770 582 791 676C802 724 800 798 796 852C792 923 751 960 660 965C462 960 345 997 217 1006C134 1013 84 973 84 894V485C84 463 88 444 96 427Z"
        fill="url(#signin-card-paper)" stroke="#fff" strokeWidth="3" filter="url(#signin-paper-shadow)" />
      <g fill="none" stroke="url(#signin-line)" strokeWidth="1.8">
        <path d="M139 586V495C139 449 175 409 221 402V472" />
        <path d="M147 616V514C147 465 185 427 236 427V476" />
      </g>
    </svg>
  );
}
