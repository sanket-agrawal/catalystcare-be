// import {prisma} from '../../infrastructure/prisma/client';

// const create = async (model: any, data: any) => {
//     return await prisma[model].create({ data });
// }

// const findAll = async (model: any, query: any) => {
//     return await prisma[model].findMany(query);
// }

// const findOne = async (model: any, query: any) => {
//     return await prisma[model].findUnique(query);
// }

// const update = async (model: any, query: any, data: any) => {
//     return await prisma[model].update({ ...query, data });
// }

// const deleteOne = async (model: any, query: any) => {
//     return await prisma[model].delete(query);
// }

// export default {
//     create,
//     findAll,
//     findOne,
//     update,
//     deleteOne
// };