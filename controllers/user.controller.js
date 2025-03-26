import { PrismaClient } from "@prisma/client/extension";

const prisma = new PrismaClient();

const registerController = async(req, res) => {

  await prisma.user.findUnique({
    where: {email}
  })

}



export { registerController }