import HomePage from "@/components/home/HomePage";

export const metadata = {
  title: "Demo",
  description: "A short walkthrough of Flame in Freefall, and NASA footage of a spacecraft fire experiment.",
};

/** /demo opens Home directly on the Demo & media view. */
export default function Page() {
  return <HomePage initialView="demo" />;
}
