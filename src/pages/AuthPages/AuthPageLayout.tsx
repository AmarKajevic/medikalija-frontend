import React from "react";
import GridShape from "@shared/ui/common/GridShape";
import { Link } from "react-router";
import ThemeTogglerTwo from "@shared/ui/common/ThemeTogglerTwo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <div className="relative flex flex-col justify-center w-full h-screen lg:flex-row dark:bg-gray-900 sm:p-0">
        <div className="flex flex-col items-center pt-8 lg:hidden">
          <Link to="/" className="block">
            <img
              width={72}
              height={72}
              src="/images/logo/medikalija-logo.png"
              alt="Medikalija"
              className="rounded-full shadow-md"
            />
          </Link>
          <h1 className="mt-3 text-lg font-semibold text-gray-800 dark:text-white/90">
            Dobrodošli u Medikaliju
          </h1>
        </div>
        {children}
        <div className="items-center hidden w-full h-full lg:w-1/2 bg-gradient-to-br from-green-800 to-emerald-950 lg:grid">
          <div className="relative flex items-center justify-center z-1">
            {/* <!-- ===== Common Grid Shape Start ===== --> */}
            <GridShape />
            <div className="flex flex-col items-center max-w-xs">
              <Link to="/" className="block mb-6">
                <img
                  width={140}
                  height={140}
                  src="/images/logo/medikalija-logo.png"
                  alt="Medikalija"
                  className="rounded-full bg-white/95 p-3 shadow-lg"
                />
              </Link>
              <h2 className="text-center text-2xl font-semibold text-white">
                Dobrodošli u Medikaliju
              </h2>
              <p className="mt-2 text-center text-green-100/80">
                Dom za stara lica — ustanova socijalne zaštite
              </p>
            </div>
          </div>
        </div>
        <div className="fixed z-50 hidden bottom-6 right-6 sm:block">
          <ThemeTogglerTwo />
        </div>
      </div>
    </div>
  );
}
