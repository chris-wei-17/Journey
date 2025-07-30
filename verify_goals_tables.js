import { db } from './server/db.js';
import { sql } from 'drizzle-orm';

async function verifyGoalTables() {
  try {
    console.log('🔍 Checking if goal_targets table exists...');
    
    // Check if goal_targets table exists
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'goal_targets'
      );
    `);
    
    console.log('goal_targets table exists:', tableExists.rows[0].exists);
    
    if (tableExists.rows[0].exists) {
      // Check table structure
      const columns = await db.execute(sql`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'goal_targets' 
        ORDER BY ordinal_position;
      `);
      
      console.log('goal_targets columns:');
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
      
      // Check if there are any goals
      const goalCount = await db.execute(sql`SELECT COUNT(*) FROM goal_targets;`);
      console.log('Total goals in database:', goalCount.rows[0].count);
    }
    
    // Check goal_progress table
    const progressTableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'goal_progress'
      );
    `);
    
    console.log('goal_progress table exists:', progressTableExists.rows[0].exists);
    
  } catch (error) {
    console.error('❌ Error checking goal tables:', error);
  } finally {
    process.exit(0);
  }
}

verifyGoalTables();