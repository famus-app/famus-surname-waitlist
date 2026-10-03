import type { ReactNode } from "react";

// Types
interface SocialBoxProps {
  href: string;
  icon: ReactNode;
  className: string;
  delay?: string;
  label: string;
}

interface SocialCardProps {
  title?: string;
  socialLinks?: Array<{
    href: string;
    icon: ReactNode;
    className: string;
    delay?: string;
    label: string;
  }>;
}

// SVG Icons
const InstagramIcon = () => (
  <svg viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg" className="svg">
    <path d="M 9.9980469 3 C 6.1390469 3 3 6.1419531 3 10.001953 L 3 20.001953 C 3 23.860953 6.1419531 27 10.001953 27 L 20.001953 27 C 23.860953 27 27 23.858047 27 19.998047 L 27 9.9980469 C 27 6.1390469 23.858047 3 19.998047 3 L 9.9980469 3 z M 22 7 C 22.552 7 23 7.448 23 8 C 23 8.552 22.552 9 22 9 C 21.448 9 21 8.552 21 8 C 21 7.448 21.448 7 22 7 z M 15 9 C 18.309 9 21 11.691 21 15 C 21 18.309 18.309 21 15 21 C 11.691 21 9 18.309 9 15 C 9 11.691 11.691 9 15 9 z M 15 11 A 4 4 0 0 0 11 15 A 4 4 0 0 0 15 19 A 4 4 0 0 0 19 15 A 4 4 0 0 0 15 11 z" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" className="svg">
    <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="svg">
    <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.55C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.72C24 .77 23.2 0 22.22 0z" />
  </svg>
);


// Components
const SocialBox = ({ href, icon, className, delay, label }: SocialBoxProps) => (
  <a href={href} aria-label={label} title={label}>
    <div className={`box ${className}`} style={{ transitionDelay: delay }}>
      <span className="icon">{icon}</span>
    </div>
  </a>
);

const SocialCard = ({
  title = "Socials",
  socialLinks = [
    { href: "#", icon: <InstagramIcon />, className: "box1", label: "Instagram" },
    { href: "##", icon: <XIcon />, className: "box2", delay: "0.2s", label: "X" },
    { href: "###", icon: <LinkedInIcon />, className: "box3", delay: "0.4s", label: "LinkedIn" },

  ],
}: SocialCardProps) => (
  <div className="card">
    <div className="background" />
    <div className="logo">{title}</div>

    {socialLinks.map((link, index) => (
      <SocialBox key={index} {...link} />
    ))}

    <div className="box box4" style={{ transitionDelay: "0.6s" }} />
  </div>
);

export function SocialFollow() {
  return (
    <div className="famus-socials">
      <SocialCard title="BE AN INSIDER " />
    </div>
  );
}
