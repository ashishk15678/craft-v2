import { ReactNode } from "react";

export default function AuthLayout({children}:{children:ReactNode}) {
  return <>
    {/*h-[calc(100vh-(var(--spacing)*10))] this basically gives full height except the top navbar*/}
  {children}
  </>
}
