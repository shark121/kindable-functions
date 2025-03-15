import { FieldValue, getFirestore } from "firebase-admin/firestore"; // Import Firestore from Firebase Admin SDK
import { onDocumentWritten } from "firebase-functions/firestore";
import { initializeApp } from "firebase-admin/app";
import { DonationSchemaType, FundraiserSchemaType } from "./lib/types";
import { isoToYYYYMMDD } from "./lib/helpers";

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

        const statiticsCollectionRef = db.collection("statistics");
        const statisticsDocRef = statiticsCollectionRef.doc(creatorId);
        const dateId = isoToYYYYMMDD(Donation.createdAt);

        await statisticsDocRef.set(
          {
            [dateId]: {
              donations: FieldValue.increment(1),
              amount: FieldValue.increment(createdAmount),
              donation: FieldValue.arrayUnion({
                donationId: Donation.id,
                amount: createdAmount,
                fundraiserId,
                donorId: Donation.donorId,                
              }),
              dateId,
            },
          },
          { merge: true }
        );

        console.log(`User ${creatorId} document updated successfully.`);
      }
    } catch (error) {
      console.error("Error in donationsCreate:", error);
    }
  }
);
