/*
    Mess Timetable and Canteen Availability Checker
    
    Submitted by:
    Vardaan Gahlot (2501200031) 
    Kunal Malik (2501200046) 
    Ripunjay Saini (2501200058)

    Batch: G2 (Mathematics & Computing)

*/

#include <stdio.h>
#include <string.h>
#include <stdlib.h>

#define MAX_NAME 50
#define MAX_DESC 100
#define MESS_FILE "mess_data.dat"
#define CANTEEN_FILE "canteen_data.dat"
#define COMPLAINT_FILE "complaints.dat"

typedef struct {
    int itemID;
    char name[MAX_NAME];
    float price;
    int isAvailable; 
} CanteenItem;

typedef struct {
    char dayName[15];
    char breakfast[MAX_DESC];
    char lunch[MAX_DESC];
    char dinner[MAX_DESC];
} MessDay;

typedef struct {
    int id;
    char studentName[MAX_NAME];
    char category[20]; 
    char description[MAX_DESC];
} Complaint;

void initializeSystem();
void adminLoginScreen();
void adminDashboard();
void studentDashboard();
void messTimetable(int isAdmin);
void canteenMenu(int isAdmin);
void submitFeedback();
void viewFeedbacks();
void clearScreen();
void pause();

//Welcome Screen
int main() {
    int roleChoice;
    initializeSystem();

    while(1) {
        clearScreen();

        printf("\n");
        printf("Welcome!\n");
        printf("\n");
        printf(" [1] Student\n");
        printf(" [2] Administrator\n");
        printf(" [3] Exit\n");
        printf("\n");
        printf(" Select Role: ");
        scanf("%d", &roleChoice);

        switch(roleChoice) {
            case 1:
                studentDashboard();
                break;
            case 2:
                adminLoginScreen();
                break;
            case 3:
                exit(0);
            default:
                printf("\nInvalid Selection.\n");
                pause();
        }
    }
    return 0;
}

//Login Screen
void adminLoginScreen() {
    char enteredID[50]; 
    char enteredPass[50];

    clearScreen();

    printf("\nAdministrator Login\n");
    printf("\n");
    
    printf("Login ID: ");
    scanf("%s", enteredID); 

    printf("Password: ");
    scanf("%s", enteredPass);

    if(strcmp(enteredID, "Kunal") == 0) {
        if(strcmp(enteredPass, "Kunal@2706") == 0) {
            adminDashboard();
        } else {
            printf("\n[!] Wrong password.\n");
            pause();
        }
    }
    else if(strcmp(enteredID, "Ripunjay") == 0) {
        if(strcmp(enteredPass, "RIP@2007.com") == 0) {
            adminDashboard();
        } else {
            printf("\n[!] Wrong password.\n");
            pause();
        }
    }
    else if(strcmp(enteredID, "Vardaan") == 0) {
        if(strcmp(enteredPass, "Vardaan@2006") == 0) {
            adminDashboard();
        } else {
            printf("\n[!] Wrong password.\n");
            pause();
        }
    }
    else {

        printf("\n[!] Wrong admin id.\n");
        pause();
    }
}

//Student Dashboard
void studentDashboard() {
    int choice;
    while(1) {
        clearScreen();

        printf("\nSelect an option \n");
        printf("\n");
        printf("[1] Mess Timetable\n");
        printf("[2] Canteen Menu\n");
        printf("[3] Submit Feedback\n");
        printf("[4] Back\n");
        printf("\n");
        printf("Choice: ");
        scanf("%d", &choice);

        switch(choice) {
            case 1: messTimetable(0); break;
            case 2: canteenMenu(0); break;
            case 3: submitFeedback(); break;
            case 4: return;
            default: pause();
        }
    }
}

//Admin Dashboard
void adminDashboard() {
    int choice;
    while(1) {
        clearScreen();

        printf("\nSelect an option \n");
        printf("\n");
        printf("[1] Feedback\n"); 
        printf("[2] Mess Timetable\n");
        printf("[3] Canteen Menu\n");
        printf("[4] Logout\n");
        printf("\n");
        printf("Choice: ");
        scanf("%d", &choice);

        switch(choice) {
            case 1: viewFeedbacks(); break;
            case 2: messTimetable(1); break;
            case 3: canteenMenu(1); break;
            case 4: return;
            default: pause();
        }
    }
}

//Mess Menu
void messTimetable(int isAdmin) {
    FILE *fp = fopen(MESS_FILE, "rb+");
    MessDay days[7];
    int dayChoice;

    if(!fp) return;
    fread(days, sizeof(MessDay), 7, fp);

    clearScreen();
    printf("\nMess Timetable \n");
    printf("\n");
    printf("Select Day:\n");
    for(int i=0; i<7; i++) {
        printf("[%d] %s\n", i+1, days[i].dayName);
    }
    printf("[8] View All Days\n");
    printf("\n");
    printf("Choice: ");
    scanf("%d", &dayChoice);

    if(dayChoice == 8) {
        clearScreen();
        printf("\nFull Weekly Menu\n");
        for(int i=0; i<7; i++) {
            printf("\n> %s\n B: %s | L: %s | D: %s\n", days[i].dayName, days[i].breakfast, days[i].lunch, days[i].dinner);
        }
        pause();
    } 
    else if(dayChoice >= 1 && dayChoice <= 7) {
        int idx = dayChoice - 1;
        
        clearScreen();
        printf("\n%s's Menu \n", days[idx].dayName);
        printf("\n");
        printf("Breakfast : %s\n", days[idx].breakfast);
        printf("Lunch     : %s\n", days[idx].lunch);
        printf("Dinner    : %s\n", days[idx].dinner);
        printf("\n");

        if(isAdmin) {
            char confirm;
            printf("Do you want to update this menu? (y/n): ");
            scanf(" %c", &confirm);
            if(confirm == 'y' || confirm == 'Y') {
                printf("\nEnter New Breakfast: ");
                scanf(" %[^\n]", days[idx].breakfast);
                printf("Enter New Lunch: ");
                scanf(" %[^\n]", days[idx].lunch);
                printf("Enter New Dinner: ");
                scanf(" %[^\n]", days[idx].dinner);
                
                // Save
                rewind(fp);
                fwrite(days, sizeof(MessDay), 7, fp);
                printf("\nUpdated Successfully!!\n");
            }
        }
        pause();
    }
    fclose(fp);
}


//Canteen Menu
void canteenMenu(int isAdmin) {
    FILE *fp = fopen(CANTEEN_FILE, "rb+");
    CanteenItem item;
    int maxID = 100;

    if(!fp) return;

    clearScreen();
    printf("\nCanteen Menu\n");
    printf("\n");
    

    while(fread(&item, sizeof(CanteenItem), 1, fp)) {
        printf(" [%d] %-15s Rs.%.1f  [%s]\n", 
               item.itemID, item.name, item.price, 
               item.isAvailable ? "Available" : "Sold Out");
        if(item.itemID > maxID) maxID = item.itemID;
    }
    printf("\n");

    if(isAdmin) {
        int adminChoice;
        printf("\nAdmin Options:\n");
        printf("\n");
        printf("[1] Toggle Item Availability\n");
        printf("[2] Add New Item\n");
        printf("[0] Go Back\n");
        printf("\n");
        printf("Choice: ");
        scanf("%d", &adminChoice);
        
        if(adminChoice == 1) {

            int targetID, found = 0;
            printf("\nEnter Item ID to toggle: ");
            scanf("%d", &targetID);
            
            rewind(fp);
            while(fread(&item, sizeof(CanteenItem), 1, fp)) {
                if(item.itemID == targetID) {
                    item.isAvailable = !item.isAvailable;
                    fseek(fp, -sizeof(CanteenItem), SEEK_CUR);
                    fwrite(&item, sizeof(CanteenItem), 1, fp);
                    found = 1;
                    printf("Status Updated!!\n");
                    break;
                }
            }
            if(!found) printf("ID not found.\n");
            pause();
        }
        else if(adminChoice == 2) {

            CanteenItem newItem;
            newItem.itemID = maxID + 1; 
            newItem.isAvailable = 1;   
            
            printf("\nAdding New Item (ID: %d)\n", newItem.itemID);
            printf("\n");
            printf("Enter Item Name: ");
            scanf(" %[^\n]", newItem.name);
            printf("Enter Price: ");
            scanf("%f", &newItem.price);
            
            fseek(fp, 0, SEEK_END);
            fwrite(&newItem, sizeof(CanteenItem), 1, fp);
            printf("\n[Success] %s added to Canteen Menu!\n", newItem.name);
            pause();
        }
    } else {
        pause();
    }
    fclose(fp);
}

//Feedbacks
void submitFeedback() {
    FILE *fp = fopen(COMPLAINT_FILE, "ab");
    Complaint c;
    c.id = rand() % 1000;
    
    clearScreen();
    printf("\nSubmit Feedback \n");
    printf("\n");
    printf("Name: ");
    scanf(" %[^\n]", c.studentName);
    
    int catChoice;
    printf(" Category [1] Mess [2] Canteen: ");
    scanf("%d", &catChoice);
    if(catChoice == 1) strcpy(c.category, "Mess");
    else strcpy(c.category, "Canteen");

    printf("Feedback: ");
    scanf(" %[^\n]", c.description);

    fwrite(&c, sizeof(Complaint), 1, fp);
    printf("\n[Submitted] Feedback Sent!\n");
    fclose(fp);
    pause();
}

void viewFeedbacks() {
    FILE *fp = fopen(COMPLAINT_FILE, "rb");
    Complaint c;
    int filterChoice;

    if(!fp) { printf("No feedbacks yet.\n"); pause(); return; }

    clearScreen();
    printf("\nStudent Feedbacks \n");
    printf("\n");
    printf("[1] Mess Feedbacks\n");
    printf("[2] Canteen Feedbacks\n");
    printf("Select Category: ");
    scanf("%d", &filterChoice);

    char filterStr[20];
    if(filterChoice == 1) strcpy(filterStr, "Mess");
    else strcpy(filterStr, "Canteen");

    printf("\n%s Feedbacks\n", filterStr);
    int count = 0;
    while(fread(&c, sizeof(Complaint), 1, fp)) {
        if(strcmp(c.category, filterStr) == 0) {
            printf(" #%d (%s): %s\n", c.id, c.studentName, c.description);
            count++;
        }
    }
    if(count == 0) printf("No feedbacks in this category.\n");
    
    fclose(fp);
    pause();
}

//Initializing System
void initializeSystem() {
    FILE *fp = fopen(MESS_FILE, "rb");
    if(!fp) {
        fp = fopen(MESS_FILE, "wb");
        
        MessDay week[7] = {
            {"Monday",    "Aloo Paratha, Curd", "Rajma Chawal, Salad",   "Mix Veg, Roti, Kheer"},
            {"Tuesday",   "Idli Sambar",        "Kadhi Pakora, Rice",    "Egg Curry / Shahi Paneer"},
            {"Wednesday", "Poha, Jalebi",       "Veg Biryani, Raita",    "Chicken Curry / Malai Kofta"},
            {"Thursday",  "Veg Sandwich",       "Dal Makhani, Naan",     "Aloo Gobhi, Roti"},
            {"Friday",    "Puri Sabzi",         "Chole Bhature",         "Fried Rice, Manchurian"},
            {"Saturday",  "Masala Dosa",        "Khichdi, Achar, Papad", "Special Thali"},
            {"Sunday",    "Chola Puri",         "Mutter Paneer, Pulao",  "Burger, French Fries"}
        };

        fwrite(week, sizeof(MessDay), 7, fp);
        fclose(fp);
    } else fclose(fp);

    fp = fopen(CANTEEN_FILE, "rb");
    if(!fp) {
        fp = fopen(CANTEEN_FILE, "wb");

        CanteenItem items[] = {
            {101, "Cold Coffee", 45.0, 1},
            {102, "Hot Coffee", 20.0, 1},
            {103, "Chai", 10.0, 1},
            {104, "Samosa", 10.0, 1},
            {105, "Aloo Patties", 35.0, 1},
            {106, "Veg Burger", 35.0, 1},
            {107, "Spring Roll", 80.0, 1},
            {108, "Paneer Parantha", 70.0, 1},
            {109, "Grilled Sandwich", 75.0, 1},
            {110, "French Fries", 40.0, 0}, 
            {111, "Chocolate Shake", 50.0, 1},
            {112, "Chips", 20.0, 1},
            {113, "Red Sauce Pasta", 70.0, 1},
            {114, "Egg (2pc)", 25.0, 1}
        };
        
        int count = sizeof(items) / sizeof(items[0]);
        fwrite(items, sizeof(CanteenItem), count, fp);
        fclose(fp);
    } else fclose(fp);
}

void clearScreen() {
        system("clear");
}

void pause() {
    printf("\nPress Enter ");
    getchar(); getchar();
}