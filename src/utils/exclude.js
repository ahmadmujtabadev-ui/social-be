export const excludeitems = (user, ...keys) => {
  for (let key of keys) {
    user[key] = undefined;
  }
  return user;
};

export default excludeitems;
