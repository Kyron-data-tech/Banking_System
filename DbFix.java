import java.sql.*;

public class DbFix {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:h2:file:./data/banking_db;AUTO_SERVER=TRUE";
        String user = "SA";
        String password = "";
        
        try (Connection conn = DriverManager.getConnection(url, user, password);
             Statement stmt = conn.createStatement()) {
             
            stmt.executeUpdate("UPDATE users SET upi_id = 'mjstyle65@okkyro' WHERE email = 'mjstyle65@gmail.com'");
            stmt.executeUpdate("UPDATE users SET upi_id = 'vanshj7818@okkyro' WHERE email = 'vanshj7818@gmail.com'");
            System.out.println("Swapped successfully.");
        }
    }
}
