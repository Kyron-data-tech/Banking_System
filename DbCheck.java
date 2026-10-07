import java.sql.*;

public class DbCheck {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:h2:file:./data/banking_db;AUTO_SERVER=TRUE";
        String user = "SA";
        String password = "";
        
        try (Connection conn = DriverManager.getConnection(url, user, password);
             Statement stmt = conn.createStatement()) {
             
            ResultSet rs = stmt.executeQuery("SELECT email, upi_id FROM users WHERE email IN ('mjstyle65@gmail.com', 'vanshj7818@gmail.com')");
            while(rs.next()) {
                System.out.println(rs.getString("email") + " -> " + rs.getString("upi_id"));
            }
        }
    }
}
