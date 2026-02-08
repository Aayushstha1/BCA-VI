-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jan 29, 2026 at 01:33 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `scooterrentaldb`
--

-- --------------------------------------------------------

--
-- Table structure for table `city`
--

CREATE TABLE `city` (
  `city_id` int(11) NOT NULL,
  `city_name` varchar(100) NOT NULL,
  `region` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `city`
--

INSERT INTO `city` (`city_id`, `city_name`, `region`) VALUES
(1, 'London', 'Greater London'),
(2, 'Manchester', 'North West'),
(3, 'Birmingham', 'West Midlands'),
(4, 'Leeds', 'West Yorkshire'),
(5, 'Glasgow', 'Scotland');

-- --------------------------------------------------------

--
-- Table structure for table `customer`
--

CREATE TABLE `customer` (
  `customer_id` int(11) NOT NULL,
  `email` varchar(150) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `DOB` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `customer`
--

INSERT INTO `customer` (`customer_id`, `email`, `phone`, `address`, `DOB`) VALUES
(1, 'sajraj1@gmail.com', '+977980000001', 'Kathmandu, Nepal', '2000-06-13'),
(2, 'anisha2@gmail.com', '+977980000002', 'Lalitpur, Nepal', '1998-02-21'),
(3, 'bikash3@gmail.com', '+977980000003', 'Bhaktapur, Nepal', '1995-08-15'),
(4, 'pragya4@gmail.com', '+977980000004', 'Pokhara, Nepal', '1999-01-10'),
(5, 'roshan5@gmail.com', '+977980000005', 'Chitwan, Nepal', '2001-11-30'),
(6, 'samir6@gmail.com', '+977980000006', 'Dharan, Nepal', '2002-05-05'),
(7, 'nisha7@gmail.com', '+977980000007', 'Biratnagar, Nepal', '1997-07-07'),
(8, 'sandeep8@gmail.com', '+977980000008', 'Hetauda, Nepal', '2000-12-12'),
(9, 'kiran9@gmail.com', '+977980000009', 'Janakpur, Nepal', '1996-03-22'),
(10, 'pratik10@gmail.com', '+977980000010', 'Butwal, Nepal', '1994-09-18'),
(11, 'tulsi11@gmail.com', '+977980000011', 'Pokhara, Nepal', '1995-04-01'),
(12, 'ritesh12@gmail.com', '+977980000012', 'Kathmandu, Nepal', '1993-06-06'),
(13, 'bina13@gmail.com', '+977980000013', 'Lalitpur, Nepal', '1999-09-09'),
(14, 'sujan14@gmail.com', '+977980000014', 'Birgunj, Nepal', '2001-01-01'),
(15, 'anup15@gmail.com', '+977980000015', 'Pokhara, Nepal', '2000-08-20');

-- --------------------------------------------------------

--
-- Table structure for table `maintenance`
--

CREATE TABLE `maintenance` (
  `maintenance_id` int(11) NOT NULL,
  `scooter_id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `issue_type` varchar(100) DEFAULT NULL,
  `maintenance_status` enum('Pending','In Progress','Completed') DEFAULT 'Pending',
  `complete_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `maintenance`
--

INSERT INTO `maintenance` (`maintenance_id`, `scooter_id`, `staff_id`, `issue_type`, `maintenance_status`, `complete_date`) VALUES
(1, 4, 1, 'Battery Issue', 'Completed', '2026-01-05'),
(2, 2, 2, 'Brake Check', 'Pending', NULL),
(3, 3, 3, 'Tire Replacement', 'In Progress', NULL),
(4, 1, 1, 'Routine Check', 'Completed', '2026-01-07'),
(5, 5, 5, 'Software Update', 'Pending', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `membership`
--

CREATE TABLE `membership` (
  `membership_id` int(11) NOT NULL,
  `plan_name` varchar(50) NOT NULL,
  `monthly_fee` decimal(10,2) NOT NULL,
  `per_minute_rate` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `membership`
--

INSERT INTO `membership` (`membership_id`, `plan_name`, `monthly_fee`, `per_minute_rate`) VALUES
(1, 'Basic', 20.00, 0.50),
(2, 'Standard', 35.00, 0.40),
(3, 'Premium', 50.00, 0.30),
(4, 'Student', 15.00, 0.25),
(5, 'Corporate', 70.00, 0.20);

-- --------------------------------------------------------

--
-- Table structure for table `payment`
--

CREATE TABLE `payment` (
  `payment_id` int(11) NOT NULL,
  `trip_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` enum('Cash','Card','Online') DEFAULT 'Card',
  `payment_status` enum('Pending','Completed','Failed') DEFAULT 'Pending',
  `payment_date` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payment`
--

INSERT INTO `payment` (`payment_id`, `trip_id`, `amount`, `payment_method`, `payment_status`, `payment_date`) VALUES
(1, 1, 15.00, 'Card', 'Completed', '2026-01-01 09:00:00'),
(2, 2, 22.00, 'Online', 'Completed', '2026-01-02 10:00:00'),
(3, 3, 8.00, 'Cash', 'Completed', '2026-01-03 10:30:00'),
(4, 4, 30.00, 'Card', 'Completed', '2026-01-03 12:00:00'),
(5, 5, 17.50, 'Online', 'Pending', '2026-01-04 13:00:00'),
(6, 6, 12.00, 'Card', 'Completed', '2026-01-05 14:00:00'),
(7, 7, 28.00, 'Online', 'Completed', '2026-01-05 15:00:00'),
(8, 8, 15.00, 'Cash', 'Pending', '2026-01-06 16:00:00'),
(9, 9, 25.00, 'Card', 'Completed', '2026-01-06 17:00:00'),
(10, 10, 10.00, 'Online', 'Completed', '2026-01-07 18:00:00'),
(11, 11, 18.00, 'Card', 'Completed', '2026-01-07 19:00:00'),
(12, 12, 28.00, 'Online', 'Completed', '2026-01-08 09:00:00'),
(13, 13, 22.00, 'Cash', 'Completed', '2026-01-08 10:00:00'),
(14, 14, 15.00, 'Card', 'Pending', '2026-01-09 11:00:00'),
(15, 15, 20.00, 'Online', 'Completed', '2026-01-09 12:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `scooter`
--

CREATE TABLE `scooter` (
  `scooter_id` int(11) NOT NULL,
  `model_id` int(11) NOT NULL,
  `battery_capacity` int(11) DEFAULT NULL,
  `status` enum('Available','In Use','Maintenance') DEFAULT 'Available'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `scooter`
--

INSERT INTO `scooter` (`scooter_id`, `model_id`, `battery_capacity`, `status`) VALUES
(1, 1, 500, 'Available'),
(2, 2, 600, 'Available'),
(3, 3, 550, 'Available'),
(4, 4, 650, 'Maintenance'),
(5, 5, 500, 'Available'),
(6, 1, 500, 'Available'),
(7, 2, 600, 'In Use'),
(8, 3, 550, 'Available'),
(9, 4, 650, 'Available'),
(10, 5, 500, 'Available');

-- --------------------------------------------------------

--
-- Table structure for table `scooter_model`
--

CREATE TABLE `scooter_model` (
  `model_id` int(11) NOT NULL,
  `model_name` varchar(100) NOT NULL,
  `manufacturer` varchar(100) DEFAULT NULL,
  `battery_capacity` int(11) DEFAULT NULL,
  `max_range_km` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `scooter_model`
--

INSERT INTO `scooter_model` (`model_id`, `model_name`, `manufacturer`, `battery_capacity`, `max_range_km`) VALUES
(1, 'EcoRide X1', 'EcoRide', 500, 60),
(2, 'EcoRide X2', 'EcoRide', 600, 80),
(3, 'VoltGo V1', 'VoltGo', 550, 65),
(4, 'VoltGo V2', 'VoltGo', 650, 90),
(5, 'SwiftScoot S1', 'SwiftScoot', 500, 50);

-- --------------------------------------------------------

--
-- Table structure for table `staff`
--

CREATE TABLE `staff` (
  `staff_id` int(11) NOT NULL,
  `staff_name` varchar(100) NOT NULL,
  `role` varchar(50) DEFAULT NULL,
  `city_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `staff`
--

INSERT INTO `staff` (`staff_id`, `staff_name`, `role`, `city_id`) VALUES
(1, 'Rajesh Thapa', 'Technician', 1),
(2, 'Sita Shrestha', 'Technician', 2),
(3, 'Binod Khatri', 'Technician', 3),
(4, 'Anita Gurung', 'Manager', 1),
(5, 'Hari Joshi', 'Technician', 4);

-- --------------------------------------------------------

--
-- Table structure for table `trip`
--

CREATE TABLE `trip` (
  `trip_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `scooter_id` int(11) NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime DEFAULT NULL,
  `distance_km` decimal(6,2) DEFAULT NULL,
  `duration` int(11) DEFAULT NULL,
  `cost` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `trip`
--

INSERT INTO `trip` (`trip_id`, `customer_id`, `scooter_id`, `start_time`, `end_time`, `distance_km`, `duration`, `cost`) VALUES
(1, 1, 1, '2026-01-01 08:00:00', '2026-01-01 08:30:00', 12.00, 30, 15.00),
(2, 2, 2, '2026-01-02 09:00:00', '2026-01-02 09:45:00', 18.00, 45, 22.00),
(3, 3, 3, '2026-01-03 10:00:00', '2026-01-03 10:20:00', 8.00, 20, 8.00),
(4, 4, 4, '2026-01-03 11:00:00', '2026-01-03 11:50:00', 25.00, 50, 30.00),
(5, 5, 5, '2026-01-04 12:00:00', '2026-01-04 12:35:00', 15.00, 35, 17.50),
(6, 6, 1, '2026-01-05 13:00:00', '2026-01-05 13:25:00', 10.00, 25, 12.00),
(7, 7, 2, '2026-01-05 14:00:00', '2026-01-05 14:50:00', 22.00, 50, 28.00),
(8, 8, 3, '2026-01-06 15:00:00', '2026-01-06 15:30:00', 12.00, 30, 15.00),
(9, 9, 4, '2026-01-06 16:00:00', '2026-01-06 16:40:00', 20.00, 40, 25.00),
(10, 10, 5, '2026-01-07 17:00:00', '2026-01-07 17:20:00', 9.00, 20, 10.00),
(11, 11, 1, '2026-01-07 18:00:00', '2026-01-07 18:35:00', 15.00, 35, 18.00),
(12, 12, 2, '2026-01-08 08:00:00', '2026-01-08 08:50:00', 24.00, 50, 28.00),
(13, 13, 3, '2026-01-08 09:00:00', '2026-01-08 09:40:00', 20.00, 40, 22.00),
(14, 14, 4, '2026-01-09 10:00:00', '2026-01-09 10:30:00', 12.00, 30, 15.00),
(15, 15, 5, '2026-01-09 11:00:00', '2026-01-09 11:45:00', 18.00, 45, 20.00);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `city`
--
ALTER TABLE `city`
  ADD PRIMARY KEY (`city_id`);

--
-- Indexes for table `customer`
--
ALTER TABLE `customer`
  ADD PRIMARY KEY (`customer_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `maintenance`
--
ALTER TABLE `maintenance`
  ADD PRIMARY KEY (`maintenance_id`),
  ADD KEY `scooter_id` (`scooter_id`),
  ADD KEY `staff_id` (`staff_id`);

--
-- Indexes for table `membership`
--
ALTER TABLE `membership`
  ADD PRIMARY KEY (`membership_id`);

--
-- Indexes for table `payment`
--
ALTER TABLE `payment`
  ADD PRIMARY KEY (`payment_id`),
  ADD KEY `trip_id` (`trip_id`);

--
-- Indexes for table `scooter`
--
ALTER TABLE `scooter`
  ADD PRIMARY KEY (`scooter_id`),
  ADD KEY `model_id` (`model_id`);

--
-- Indexes for table `scooter_model`
--
ALTER TABLE `scooter_model`
  ADD PRIMARY KEY (`model_id`);

--
-- Indexes for table `staff`
--
ALTER TABLE `staff`
  ADD PRIMARY KEY (`staff_id`),
  ADD KEY `city_id` (`city_id`);

--
-- Indexes for table `trip`
--
ALTER TABLE `trip`
  ADD PRIMARY KEY (`trip_id`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `scooter_id` (`scooter_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `city`
--
ALTER TABLE `city`
  MODIFY `city_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `customer`
--
ALTER TABLE `customer`
  MODIFY `customer_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `maintenance`
--
ALTER TABLE `maintenance`
  MODIFY `maintenance_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `membership`
--
ALTER TABLE `membership`
  MODIFY `membership_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `payment`
--
ALTER TABLE `payment`
  MODIFY `payment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `scooter`
--
ALTER TABLE `scooter`
  MODIFY `scooter_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `scooter_model`
--
ALTER TABLE `scooter_model`
  MODIFY `model_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `staff`
--
ALTER TABLE `staff`
  MODIFY `staff_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `trip`
--
ALTER TABLE `trip`
  MODIFY `trip_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `maintenance`
--
ALTER TABLE `maintenance`
  ADD CONSTRAINT `maintenance_ibfk_1` FOREIGN KEY (`scooter_id`) REFERENCES `scooter` (`scooter_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `maintenance_ibfk_2` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`staff_id`) ON UPDATE CASCADE;

--
-- Constraints for table `payment`
--
ALTER TABLE `payment`
  ADD CONSTRAINT `payment_ibfk_1` FOREIGN KEY (`trip_id`) REFERENCES `trip` (`trip_id`) ON UPDATE CASCADE;

--
-- Constraints for table `scooter`
--
ALTER TABLE `scooter`
  ADD CONSTRAINT `scooter_ibfk_1` FOREIGN KEY (`model_id`) REFERENCES `scooter_model` (`model_id`) ON UPDATE CASCADE;

--
-- Constraints for table `staff`
--
ALTER TABLE `staff`
  ADD CONSTRAINT `staff_ibfk_1` FOREIGN KEY (`city_id`) REFERENCES `city` (`city_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `trip`
--
ALTER TABLE `trip`
  ADD CONSTRAINT `trip_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `trip_ibfk_2` FOREIGN KEY (`scooter_id`) REFERENCES `scooter` (`scooter_id`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
