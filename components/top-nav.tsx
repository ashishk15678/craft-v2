import ToggleTheme from "./mode-toggle";

export function TopNavBar() {
  return (
    <div className="fixed top-0 left-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="relative md:max-w-4xl max-w-md mx-auto h-10 flex flex-row justify-between items-center px-4">
        {/* Logo */}
        <div>
          <span className="black-ops-one-regular">Craft-v2</span>
        </div>

        <div>
          {/*<Link href={"/docs"} >Docs</Link>*/}
        </div>

        {/* Theme Toggle */}
        <div className="flex items-center gap-x-2">
          <ToggleTheme />
          <button className="bg-indigo-600  text-white py-0.5 px-3 rounded-lg" >Profile</button>
        </div>

        {/* Clerk.com / Linear Centered Glow Line Accent */}
        {/*<div className="absolute -bottom-[1px] left-0 right-0 flex justify-center pointer-events-none">*/}
          {/* Glowing Line */}
          {/*<div className="w-1/2 h-[1px] bg-gradient-to-r from-transparent via-blue-500 to-transparent" />*/}

          {/* Subtle Outer Glow Layer */}
          {/*<div className="absolute -bottom-[1px] w-1/3 h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent blur-[2px] opacity-70" />*/}
        {/*</div>*/}
      </div>
    </div>
  );
}
