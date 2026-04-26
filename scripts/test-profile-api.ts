import { signToken } from "../src/lib/jwt";

async function main() {
  const token = signToken({
    userId: "cmn1c8zof000eiacssip76pyp", // User v@gmail.com
    role: "DEVELOPER"
  });
  console.log("Token:", token);

  const res = await fetch("http://localhost:3000/api/user/profile", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const data = await res.json();
  console.log("API Response Stats:", data.stats);
}

main().catch(console.error);
