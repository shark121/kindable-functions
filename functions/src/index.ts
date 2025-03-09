import { FieldValue, getFirestore } from "firebase-admin/firestore"; // Import Firestore from Firebase Admin SDK
import { onDocumentWritten } from "firebase-functions/firestore";
import { initializeApp } from "firebase-admin/app";
import { DonationSchemaType, FundraiserSchemaType } from "../src/lib/types";

const app = initializeApp();

const db = getFirestore(app);

export const donationsCreate = onDocumentWritten(
  "donations/{documentId}",
  async (snapshot) => {
    try {
      // const auth = snapshot.authId;

      const documentsBefore =
        snapshot.data?.before.data() as unknown as DonationSchemaType[];

      console.log("Documents Before:", documentsBefore);

      const documentsAfter =
        snapshot.data?.after.data() as unknown as DonationSchemaType[];

      console.log("Documents After:", documentsAfter);

      if (documentsBefore && documentsAfter) {
        const Donation = Object.values(
          snapshot.data?.after.data() as Record<string, DonationSchemaType>
        ).slice(-1)[0];

       

        const createdAmount = Donation.amount;
        const fundraiserId = Donation.fundraiserID;

        console.log("Created Amount:", createdAmount);

        const fundraiserCollectionRef = db.collection("fundraisers");
        const fundraiserDocRef = fundraiserCollectionRef.doc(fundraiserId);

        await fundraiserDocRef.update({
          raisedAmount: FieldValue.increment(createdAmount),
        });

        console.log(
          `Fundraiser ${fundraiserId} document updated successfully.`
        );

        const getCreatorId = (
          await fundraiserDocRef.get()
        ).data() as unknown as FundraiserSchemaType;
        const creatorId = getCreatorId.creator.uid;

        const usersCollectionRef = db.collection("users");
        const creatorDocRef = usersCollectionRef.doc(creatorId);

        await creatorDocRef.update({
          raisedAmount: FieldValue.increment(createdAmount),
        });

        console.log(`User ${creatorId} document updated successfully.`);
      }
      // if (auth) {
      //   console.log("User UID:", auth);
      // } else {
      //   console.log("Unauthenticated request");
      // }
    } catch (error) {
      console.error("Error in donationsCreate:", error);
    }
  }
);
