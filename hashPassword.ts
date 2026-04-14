import bcrypt from "bcrypt";

async function generate() {
  const hash = await bcrypt.hash("@#0724716711El", 10);
  console.log(hash);
}

generate();