module.exports = (sequelize, DataTypes) => {
  const UserDetails = sequelize.define('UserDetails', {
    firstname: {
      type: DataTypes.STRING,
      allowNulls: false,
    },
    lastname: {
      type: DataTypes.STRING,
      allowNulls: false,
    },
    emailaddress: {
      type: DataTypes.STRING,
      unique: true,
      allowNulls: false,
    },
    isAdmin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    authString: {
      type: DataTypes.STRING,
    },
    isActivated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    phonenumber: DataTypes.STRING,
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
  });
  UserDetails.associate = (models) => {
    UserDetails.belongsToMany(models.Books, {
      as: 'bookReview',
      through: 'BookReviews',
      foreignKey: 'usernameId',
      otherKey: 'bookId',
    });
    UserDetails.belongsTo(models.Memberships, {
      foreignKey: 'MembershipId',
      as: 'membership',
    });
  };
  return UserDetails;
};
