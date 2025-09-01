const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Check if leadId column already exists
      const table = await queryInterface.describeTable('visitor_sessions');
      
      if (!table.leadId) {
        await queryInterface.addColumn('visitor_sessions', 'leadId', {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: {
            model: 'leads',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        });
        
        console.log('✅ Added leadId column to visitor_sessions table');
      } else {
        console.log('✅ leadId column already exists in visitor_sessions table');
      }
    } catch (error) {
      console.error('❌ Error adding leadId column:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('visitor_sessions', 'leadId');
      console.log('✅ Removed leadId column from visitor_sessions table');
    } catch (error) {
      console.error('❌ Error removing leadId column:', error);
      throw error;
    }
  }
};
